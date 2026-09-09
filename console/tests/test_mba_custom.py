"""Adding MBA items and tags at runtime -- the two things there was no way
to do at all before: the curriculum is baked into index.html at build time,
and /api/mba only ever let you tick an existing entry, never create or tag
one.

Two things this has to get right that a plain create/list pair would not:

  * additive tags -- the same "only add, never remove" rule used everywhere
    else a person's own words can change state (rules.py, the instructions
    overlay) applies here too, so add_mba_tags can never delete a tag;
  * the website itself has to see what gets added. A custom item that only
    an assistant can read would repeat the exact bug the Opportunities tab
    had before it started fetching live -- data that exists somewhere an
    assistant can see and nowhere a person would ever look.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO / "console"))

import main  # noqa: E402


class FakeBlob:
    """A GCS blob with real generation-precondition semantics -- what
    mutate_json_blob actually depends on for its safe read-modify-write.
    Mirrors tests/test_shared_writes.py's fixture rather than a simpler one,
    because a simpler one would let a real bug in the precondition path
    pass silently here."""

    def __init__(self, store, name):
        self.store = store
        self.name = name
        self.generation = None

    def download_as_bytes(self):
        from google.api_core import exceptions as gexc

        if self.name not in self.store:
            raise gexc.NotFound(self.name)
        payload, generation = self.store[self.name]
        self.generation = generation
        return payload

    def upload_from_string(self, data, content_type=None, if_generation_match=None):
        from google.api_core import exceptions as gexc

        current = self.store.get(self.name)
        current_gen = current[1] if current else 0
        if if_generation_match is not None and if_generation_match != current_gen:
            raise gexc.PreconditionFailed("generation mismatch")
        payload = data.encode() if isinstance(data, str) else data
        self.store[self.name] = (payload, current_gen + 1)


class FakeGCS:
    def __init__(self, store):
        self.store = store

    def bucket(self, name):
        return self

    def blob(self, name):
        return FakeBlob(self.store, name)


class MbaCustomBase(unittest.TestCase):
    def setUp(self):
        self.store = {}
        self._gcs = main.gcs
        main.gcs = lambda: FakeGCS(self.store)
        main.app.config["TESTING"] = True
        # Curriculum is a real, deploy-baked module global; keep it, but
        # confirm it actually has content so "unknown id" tests mean
        # something.
        self.assertTrue(main.curriculum()["mba_items"], "no baked MBA items to test against")
        self.a_real_id = main.curriculum()["mba_items"][0]["id"]

    def tearDown(self):
        main.gcs = self._gcs

    def client(self):
        return main.app.test_client()

    def custom_blob(self):
        entry = self.store.get(main.MBA_CUSTOM_BLOB)
        return json.loads(entry[0].decode()) if entry else {}


class CreatingItems(MbaCustomBase):
    def test_a_new_item_is_created_and_listed(self):
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "Book IELTS", "date": "2026-10-01"})
            self.assertEqual(resp.status_code, 201, resp.get_data(as_text=True))
            created = resp.get_json()
            self.assertTrue(created["id"].startswith("cm"))
            self.assertEqual(created["phase"], "CUSTOM")

            listed = c.get("/api/mba").get_json()["items"]
            self.assertTrue(any(i["id"] == created["id"] for i in listed))
            row = next(i for i in listed if i["id"] == created["id"])
            self.assertEqual(row["source"], "custom")
            self.assertEqual(row["task"], "Book IELTS")

    def test_a_curriculum_item_is_labelled_as_such(self):
        with self.client() as c:
            listed = c.get("/api/mba").get_json()["items"]
        row = next(i for i in listed if i["id"] == self.a_real_id)
        self.assertEqual(row["source"], "curriculum")

    def test_task_is_required(self):
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "  "})
        self.assertEqual(resp.status_code, 400)

    def test_a_malformed_date_is_refused(self):
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "x", "date": "not-a-date"})
        self.assertEqual(resp.status_code, 400)

    def test_an_empty_date_is_fine(self):
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "no date yet"})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.get_json()["date"], "")

    def test_tags_are_accepted_at_creation(self):
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "x", "tags": ["action", "verify"]})
        self.assertEqual(sorted(resp.get_json()["tags"]), ["action", "verify"])

    def test_junk_tags_are_dropped_not_rejected(self):
        """A slightly wrong tag should not sink the whole item. Case is
        normalised (consistent with how sender/domain patterns are treated
        elsewhere in this codebase) rather than rejected; a space breaks the
        tag grammar outright and that one is dropped."""
        with self.client() as c:
            resp = c.post("/api/mba/create", json={"task": "x", "tags": ["Has Space", "ok_one", "ALLCAPS"]})
        self.assertEqual(resp.get_json()["tags"], ["ok_one", "allcaps"])

    def test_it_is_capped(self):
        main.MAX_CUSTOM_MBA = 2
        try:
            with self.client() as c:
                c.post("/api/mba/create", json={"task": "one"})
                c.post("/api/mba/create", json={"task": "two"})
                third = c.post("/api/mba/create", json={"task": "three"})
            self.assertEqual(third.status_code, 400)
        finally:
            main.MAX_CUSTOM_MBA = 200

    def test_two_creates_do_not_clobber_each_other(self):
        """mutate_json_blob is what protects this; a plain read-modify-write
        would lose one of these under any real concurrency."""
        with self.client() as c:
            c.post("/api/mba/create", json={"task": "first"})
            c.post("/api/mba/create", json={"task": "second"})
        self.assertEqual(len(self.custom_blob()["items"]), 2)


class AddingTags(MbaCustomBase):
    def test_tags_land_on_a_curriculum_item(self):
        with self.client() as c:
            resp = c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["priority"]})
            self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertIn("priority", row["tags"])

    def test_original_tags_are_kept_not_replaced(self):
        """The whole point: this adds, a plain 'set' would have wiped
        whatever tags the curriculum item shipped with."""
        with self.client() as c:
            before = next(
                i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id
            )
            original_tags = set(before["tags"])
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["priority"]})
            after = next(
                i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id
            )
        self.assertTrue(original_tags.issubset(set(after["tags"])))
        self.assertIn("priority", after["tags"])

    def test_adding_the_same_tag_twice_does_not_duplicate_it(self):
        with self.client() as c:
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["priority"]})
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["priority"]})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertEqual(row["tags"].count("priority"), 1)

    def test_tags_land_on_a_custom_item_too(self):
        with self.client() as c:
            created = c.post("/api/mba/create", json={"task": "x"}).get_json()
            c.post("/api/mba/tags", json={"id": created["id"], "tags": ["urgent"]})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == created["id"])
        self.assertIn("urgent", row["tags"])

    def test_an_unknown_id_is_refused(self):
        with self.client() as c:
            resp = c.post("/api/mba/tags", json={"id": "nope-not-real", "tags": ["x"]})
        self.assertEqual(resp.status_code, 400)

    def test_at_least_one_valid_tag_is_required(self):
        with self.client() as c:
            resp = c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["Has Space"]})
        self.assertEqual(resp.status_code, 400)


class RemovingTags(MbaCustomBase):
    """The gap this session actually closes: add_mba_tags only ever added.
    A curriculum item's own baked-in tag could not be touched at all."""

    def test_a_baked_in_tag_can_be_removed(self):
        with self.client() as c:
            before = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
            baked_tag = before["tags"][0]
            resp = c.post("/api/mba/tags/remove", json={"id": self.a_real_id, "tags": [baked_tag]})
            self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
            after = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertNotIn(baked_tag, after["tags"])

    def test_an_overlay_added_tag_can_be_removed_too(self):
        with self.client() as c:
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["temp"]})
            c.post("/api/mba/tags/remove", json={"id": self.a_real_id, "tags": ["temp"]})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertNotIn("temp", row["tags"])

    def test_removing_then_re_adding_the_same_tag_brings_it_back(self):
        """Add always wins over a stale removal for the same tag -- the
        alternative is a tag you can add but that never actually shows up
        because an old removal entry is still silently suppressing it."""
        with self.client() as c:
            before = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
            baked_tag = before["tags"][0]
            c.post("/api/mba/tags/remove", json={"id": self.a_real_id, "tags": [baked_tag]})
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": [baked_tag]})
            after = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertIn(baked_tag, after["tags"])
        self.assertNotIn(self.a_real_id, self.custom_blob().get("tag_removed", {}))

    def test_other_curriculum_items_are_unaffected(self):
        """A removal is scoped to one item's tags -- not to the tag name
        globally, which would silently strip it from everything else that
        happens to share it."""
        other_id = next(
            i["id"] for i in main.curriculum()["mba_items"]
            if i["id"] != self.a_real_id and "action" in (i.get("tags") or [])
        )
        with self.client() as c:
            c.post("/api/mba/tags/remove", json={"id": self.a_real_id, "tags": ["action"]})
            other = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == other_id)
        self.assertIn("action", other["tags"])

    def test_an_unknown_id_is_refused(self):
        with self.client() as c:
            resp = c.post("/api/mba/tags/remove", json={"id": "nope", "tags": ["x"]})
        self.assertEqual(resp.status_code, 400)

    def test_at_least_one_valid_tag_is_required(self):
        with self.client() as c:
            resp = c.post("/api/mba/tags/remove", json={"id": self.a_real_id, "tags": ["Has Space"]})
        self.assertEqual(resp.status_code, 400)


class DeletingItems(MbaCustomBase):
    def test_a_custom_item_can_be_deleted(self):
        with self.client() as c:
            created = c.post("/api/mba/create", json={"task": "oops"}).get_json()
            resp = c.post("/api/mba/delete", json={"id": created["id"]})
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.get_json(), {"deleted": created["id"]})
            ids = [i["id"] for i in c.get("/api/mba").get_json()["items"]]
        self.assertNotIn(created["id"], ids)

    def test_a_curriculum_item_is_hidden_rather_than_deleted(self):
        """A real delete would only come back on the next deploy, so
        'delete' on a baked-in item means moving it into EXCLUDED instead
        -- reversibly, via restore."""
        with self.client() as c:
            resp = c.post("/api/mba/delete", json={"id": self.a_real_id})
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.get_json(), {"hidden": self.a_real_id})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertTrue(row["excluded"])
        self.assertTrue(row["overridden"])

    def test_restoring_a_hidden_curriculum_item_brings_it_back(self):
        with self.client() as c:
            c.post("/api/mba/delete", json={"id": self.a_real_id})
            c.post("/api/mba/exclude", json={"id": self.a_real_id, "excluded": False})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertFalse(row["excluded"])

    def test_deleting_clears_its_progress_tick(self):
        """Otherwise a done=true entry for an id nothing points at anymore
        sits in the progress blob forever."""
        with self.client() as c:
            created = c.post("/api/mba/create", json={"task": "oops"}).get_json()
            c.post("/api/mba/set", json={"id": created["id"], "done": True})
            c.post("/api/mba/delete", json={"id": created["id"]})
        progress = json.loads(self.store[main.PROGRESS_BLOB][0].decode())["data"]
        self.assertNotIn(created["id"], progress.get("mba", {}))

    def test_deleting_an_unknown_custom_id_is_a_404(self):
        with self.client() as c:
            resp = c.post("/api/mba/delete", json={"id": "cmdoesnotexist"})
        self.assertEqual(resp.status_code, 404)

    def test_its_overrides_are_cleaned_up_too(self):
        with self.client() as c:
            created = c.post("/api/mba/create", json={"task": "x"}).get_json()
            c.post("/api/mba/tags", json={"id": created["id"], "tags": ["temp"]})
            c.post("/api/mba/delete", json={"id": created["id"]})
        blob = self.custom_blob()
        self.assertNotIn(created["id"], blob.get("tag_add", {}))
        self.assertNotIn(created["id"], blob.get("exclude_over", {}))


class ExcludingDirectly(MbaCustomBase):
    """/api/mba/exclude, the general form delete_mba_item and
    restore_mba_item are both built from."""

    def test_forcing_excluded_true_on_an_active_item(self):
        with self.client() as c:
            c.post("/api/mba/exclude", json={"id": self.a_real_id, "excluded": True})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == self.a_real_id)
        self.assertTrue(row["excluded"])

    def test_forcing_back_to_the_baseline_drops_the_override(self):
        """Setting excluded to whatever the item's own default already is
        should not leave a redundant override sitting in the blob -- that
        is what makes restore idempotent rather than accumulating state."""
        with self.client() as c:
            c.post("/api/mba/exclude", json={"id": self.a_real_id, "excluded": True})
            c.post("/api/mba/exclude", json={"id": self.a_real_id, "excluded": False})
        self.assertNotIn(self.a_real_id, self.custom_blob().get("exclude_over", {}))

    def test_a_custom_item_can_be_excluded_without_deleting_it(self):
        with self.client() as c:
            created = c.post("/api/mba/create", json={"task": "x"}).get_json()
            c.post("/api/mba/exclude", json={"id": created["id"], "excluded": True})
            row = next(i for i in c.get("/api/mba").get_json()["items"] if i["id"] == created["id"])
        self.assertTrue(row["excluded"])
        self.assertEqual(row["source"], "custom")


class TheDeltaEndpoint(MbaCustomBase):
    """What the website itself fetches to splice onto its build-time data."""

    def test_it_returns_the_added_items_and_every_override(self):
        with self.client() as c:
            c.post("/api/mba/create", json={"task": "new one"})
            c.post("/api/mba/tags", json={"id": self.a_real_id, "tags": ["flag"]})
            c.post("/api/mba/exclude", json={"id": self.a_real_id, "excluded": True})
            delta = c.get("/api/mba/custom").get_json()
        self.assertEqual(len(delta["items"]), 1)
        self.assertEqual(delta["items"][0]["task"], "new one")
        self.assertEqual(delta["tag_add"][self.a_real_id], ["flag"])
        self.assertIs(delta["exclude_over"][self.a_real_id], True)

    def test_empty_before_anything_is_added(self):
        with self.client() as c:
            delta = c.get("/api/mba/custom").get_json()
        self.assertEqual(delta, {"items": [], "tag_add": {}, "tag_removed": {}, "exclude_over": {}})


class McpToolNames(unittest.TestCase):
    """The other half of the bug report: an email-agent tool answering a
    tracker request. Every inbox-agent tool must be unmistakably labelled,
    and the initialize handshake must say so up front."""

    def setUp(self):
        with (REPO / "console" / "mcp_http.py").open() as f:
            self.source = f.read()

    def test_every_agent_tool_is_prefixed(self):
        # ": {" makes this a top-level tool-name key, not the internal
        # d["run_agent"] dependency lookup -- that functional name is
        # unchanged on purpose, only the externally-exposed tool name moved.
        for old_name in (
            '"get_agent_settings": {', '"set_agent_instructions": {',
            '"get_agent_status": {', '"list_proposals": {', '"add_to_calendar": {',
            '"run_agent": {',
        ):
            self.assertNotIn(old_name, self.source, f"{old_name} was not renamed")
        for new_name in (
            '"email_agent_settings"', '"email_agent_set_instructions"',
            '"email_agent_status"', '"email_agent_calendar_proposals"',
            '"email_agent_add_calendar_event"', '"email_agent_run"',
        ):
            self.assertIn(new_name, self.source)

    def test_the_new_mba_tools_are_registered(self):
        for name in (
            '"add_mba_item"', '"add_mba_tags"', '"remove_mba_tags"',
            '"delete_mba_item"', '"restore_mba_item"',
        ):
            self.assertIn(name, self.source)

    def test_initialize_states_the_two_systems(self):
        self.assertIn("INSTRUCTIONS", self.source)
        self.assertIn('"instructions": INSTRUCTIONS', self.source)


class McpEndToEnd(unittest.TestCase):
    """The actual JSON-RPC surface a custom connector calls."""

    def setUp(self):
        self.store = {}
        self._gcs = main.gcs
        main.gcs = lambda: FakeGCS(self.store)
        main.app.config["TESTING"] = True

    def tearDown(self):
        main.gcs = self._gcs

    def rpc(self, method, params=None, id_=1):
        with main.app.test_client() as c:
            resp = c.post(
                "/mcp",
                json={"jsonrpc": "2.0", "id": id_, "method": method, "params": params or {}},
            )
        return resp.get_json()

    def test_initialize_carries_the_disambiguation(self):
        result = self.rpc("initialize")["result"]
        self.assertIn("email_agent_", result["instructions"])
        self.assertIn("placement/MBA", result["instructions"])

    def test_tools_list_has_no_bare_agent_tools_left(self):
        names = {t["name"] for t in self.rpc("tools/list")["result"]["tools"]}
        self.assertIn("email_agent_status", names)
        self.assertNotIn("get_agent_status", names)
        self.assertIn("add_mba_item", names)
        self.assertIn("add_mba_tags", names)
        self.assertIn("remove_mba_tags", names)
        self.assertIn("delete_mba_item", names)
        self.assertIn("restore_mba_item", names)

    def test_add_mba_item_over_json_rpc_actually_persists(self):
        result = self.rpc(
            "tools/call",
            {"name": "add_mba_item", "arguments": {"task": "call the recommender"}},
        )["result"]
        self.assertFalse(result["isError"], result)
        listed = self.rpc("tools/call", {"name": "list_mba_items", "arguments": {}})["result"]
        self.assertIn("call the recommender", listed["content"][0]["text"])

    def mba_items_by_id(self):
        listed = self.rpc("tools/call", {"name": "list_mba_items", "arguments": {}})
        payload = json.loads(listed["result"]["content"][0]["text"])
        return {i["id"]: i for i in payload["items"]}

    def test_delete_then_restore_a_curriculum_item_round_trips_over_json_rpc(self):
        """The exact complaint this session started from: a pre-existing
        item could not be deleted at all. Now it can, and reversibly."""
        real_id = main.curriculum()["mba_items"][0]["id"]

        deleted = self.rpc(
            "tools/call", {"name": "delete_mba_item", "arguments": {"item_id": real_id}}
        )["result"]
        self.assertFalse(deleted["isError"], deleted)
        self.assertEqual(json.loads(deleted["content"][0]["text"]), {"hidden": real_id})
        self.assertTrue(self.mba_items_by_id()[real_id]["excluded"])

        restored = self.rpc(
            "tools/call", {"name": "restore_mba_item", "arguments": {"item_id": real_id}}
        )["result"]
        self.assertFalse(restored["isError"], restored)
        self.assertFalse(self.mba_items_by_id()[real_id]["excluded"])

    def test_remove_mba_tags_over_json_rpc_actually_persists(self):
        real_id = main.curriculum()["mba_items"][0]["id"]
        baked_tag = main.curriculum()["mba_items"][0]["tags"][0]

        result = self.rpc(
            "tools/call",
            {"name": "remove_mba_tags", "arguments": {"item_id": real_id, "tags": [baked_tag]}},
        )["result"]
        self.assertFalse(result["isError"], result)
        self.assertNotIn(baked_tag, self.mba_items_by_id()[real_id]["tags"])

    def test_a_typo_d_old_tool_name_gets_a_clean_error_not_a_silent_wrong_call(self):
        result = self.rpc(
            "tools/call", {"name": "get_agent_status", "arguments": {}}
        )
        self.assertIn("error", result)
        self.assertEqual(result["error"]["message"], "no tool named 'get_agent_status'")


if __name__ == "__main__":
    unittest.main(verbosity=2)
