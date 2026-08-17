# Build context is the REPOSITORY ROOT, not this directory -- the image needs
# the built site from the repo root and the overlay module from inbox-agent/.
# console/cloudbuild.yaml passes `-f console/Dockerfile .` for exactly that.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY console/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY console/main.py console/mcp_http.py ./

# The overlay schema is shared with the agent rather than reimplemented, so
# the console validates a saved setting exactly as the job will read it.
#
# It has to arrive as a *package*, not as two loose modules on sys.path.
# overlay.py does `from . import rules`, which needs a parent package to
# resolve against; imported top-level it raised ImportError inside normalise()
# -- so every attempt to save the instructions box failed, and every read of
# the settings silently fell back to defaults.
COPY console/_agent/__init__.py _agent/
COPY inbox-agent/agent/overlay.py inbox-agent/agent/rules.py _agent/

# tools/build.mjs emits a single self-contained index.html; nothing else from
# the site needs to ship.
COPY index.html static/index.html

# The curriculum, so the API can resolve an opaque topic id to "the pandas
# one". Same files the page is built from, so the two cannot disagree.
COPY data/ ./data/

EXPOSE 8080
# One worker: every request is I/O against Google APIs, threads handle it, and
# a second worker would only duplicate cold-start cost on a service that
# spends most of its life scaled to zero.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 120 main:app
