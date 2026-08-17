"""The agent's shared schema modules, vendored into the console image.

overlay.py and rules.py are copied in at image build time from
inbox-agent/agent/ so the console validates a saved setting exactly as the job
will read it, rather than reimplementing the rules and drifting.

This file is the only committed thing in here, and it exists because the copies
have to form a *package*. overlay.py does `from . import rules`; with the two
files merely on sys.path there is no parent package for that to resolve
against, and the ImportError surfaced only at the moment someone tried to save
their instructions -- while every read silently returned defaults, which made
the settings page show "preview only" for a switch that was set to act.
"""
