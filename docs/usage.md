# Using dsh-trace

[Project home](../README.md) · [中文首页](../README.zh.md)

## Conversation view

After installing and enabling `@vibeinging/dsh-trace-viewer`, open a conversation and select **Trace**. Pick a turn, then select a model or tool row. The detail pane has Input, Output and Record tabs; copying takes the complete current payload. Large payloads are folded until expanded.

Search matches names, tools, files and recorded arguments. Failure and model-only filters keep the parent context. Selection remains stable when loading older history. Focus view temporarily gives the composer space to Trace, preserves its draft, and yields to pending approvals and questions.

| Field | Meaning |
| --- | --- |
| Call and parent | The official loaded trajectory and its declared call relationships |
| Turn duration | Recorded turn boundaries; not the sum of call durations |
| Call duration | Recorded start/end; no invented endpoint for incomplete calls |
| Usage | Reported model counters; missing data remains unavailable |
| Model input | What the host recorded; not necessarily the complete provider messages |
| Record tab | DSH's trajectory projection, not the raw session file |

Ordinary model output excludes assistant reasoning blocks. Tool data and recorded fields are rendered as inert text. Relationships or child-agent internals absent from the host data are not inferred.

## Trace data settings

Open **Settings → Trace data**, or use **Data management** in the Trace toolbar. The optional sidebar shortcut is hidden by default; its switch saves immediately on the current client.

![Trace data settings with collection off](https://raw.githubusercontent.com/vibeinging/dsh-trace/v0.1.0/docs/assets/readme/settings-en.png)

*Real settings component with synthetic, empty storage statistics.*

| Setting | Default | Behavior |
| --- | --- | --- |
| Collect Trace data | Off | Future committed events only; no historical backfill |
| Model/tool/failure/compaction scope | Selected | Applies after collection is enabled; failure includes interruption |
| Model response text | Off | Future response text; no reasoning blocks |
| Tool arguments and results | Off | Future tool arguments and text results |
| Retention | 30 days | 7, 30, 90, 365 days or indefinitely |
| Expiry check | Every 24 hours | 1, 6 or 24 hours; requires the Host to run |

Click **Save settings** to persist recording and retention policy. A revision conflict keeps your draft and asks you to reload; it does not silently overwrite another change. Read-only connections cannot save settings. The Host performs recording across its sessions independently of whether a Trace page is open.

Turning recording off stops additional copied events. Existing copies remain; open segments can still settle their completion status. Body switches only affect future data. They do not erase old content or provide general redaction.

## Storage and cleanup

Copies are separate JSON files under the profile's `data/dsh-trace-viewer/`. File names hash the session ID, but contents still contain the original session ID, turn and source sequence numbers. A segment may describe a turn, request or compaction; segment count is not session count.

Retention uses each segment's most recent update. Indefinite retention selects nothing for expiry. The Host checks due expiry while running, including at its first startup check. The page displays sizes, counts, active segments, write/check times and eligible records; use Refresh to update them.

Manual cleanup first previews eligible counts and bytes. Confirmation uses a short-lived token and rechecks policy, contents and activity. Active segments and segments changed after the preview are skipped. Automatic cleanup uses the same expiry and activity protections. Cleanup only removes recognized copies in this plugin's owned directory; it never deletes original DSH sessions or manages the archived yiTrace exporter's data.

The data page currently does not browse, search or export saved copies. The conversation waterfall continues to read original DSH trajectory data, not the copies.

## Troubleshooting

- **Trace is empty or unavailable:** open an existing conversation and keep the official Trajectory provider enabled. Check the tested SDK version in the README.
- **Trace settings returns 404 or Host dependencies are not ready:** enable the plugin's Host component; if a hot reload leaves the old module cached, quit DSH normally and reopen it.
- **A value is unavailable:** the host did not provide it. Enabling future recording does not backfill old data or fix missing original counters.
- **A local development install is still loaded:** replace the same package's `link:` dependency with the npm version, keeping one enabled copy. Use the actual same profile for updates and removal.
- **Removing the plugin:** use the DSH plugin page or the README's removal command. Existing saved copies are retained.
