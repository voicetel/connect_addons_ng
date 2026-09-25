# Oduist Connect VoiceML — installation

VoiceML provider module for Oduist Connect.

## What this is

A provider module in the image of `connect_twilio` (ADR-031/ADR-032) that
drives VoiceTel's **VoiceML** — the Twilio-wire-compatible voice + SMS + AMD
service — instead of Twilio. REST calls go through the official
[`voiceml-python-sdk`](https://github.com/voicetel/voiceml-python-sdk); the
browser softphone is a **JsSIP (SIP-over-WebRTC)** client registering against
the VoiceML **OpenSIPS WSS edge**, not the Twilio Voice JS SDK.

## Prerequisites

- Odoo 19.0 with `connect` installed.
- `voiceml` Python package (`pip install voiceml`, or list it in
  `requirements.txt`; it is declared as the module's python dependency).
- A VoiceML tenant with an `AccountSid` and API key.
- (For the softphone) the VoiceML OpenSIPS registrar's `wss://` URL.

## Configuration

1. Install `connect_voiceml`.
2. Open **Connect → VoiceML → Configuration → Settings**.
3. Fill in:
   - **Account SID** — the VoiceML tenant sid (`AC…`).
   - **API Key** — the tenant key. It is both the SDK auth token and the
     `X-Twilio-Signature` verification key for inbound webhooks.
   - **VoiceML API URL** — e.g. `https://voiceml.voicetel.com`.
   - **WebRTC WSS URL** — e.g. `wss://<node>:8443` (the OpenSIPS registrar).
4. Click **SYNC VOICEML ACCOUNT** — this provisions TwiML applications, SIP
   domains + credential lists, phone numbers and outgoing caller IDs.

## Webhooks

The module serves these public, signature-verified endpoints (all POST,
HMAC-SHA1 `X-Twilio-Signature` keyed with the API key):

```
/voiceml/webhook/domain
/voiceml/webhook/number
/voiceml/webhook/callstatus
/voiceml/webhook/callaction
/voiceml/webhook/recordingstatus
/voiceml/webhook/vm_recordingstatus
/voiceml/webhook/outgoing_callerid
/voiceml/webhook/callflow/<id>/gather
/voiceml/webhook/<model>/call_action/<id>
/voiceml/webhook/application/<id>
/voiceml/webhook/message
/voiceml/webhook/message_status
```

## Current scope and known gaps

This is a scaffold. Implemented: settings + REST client, sync, click-to-call
originate, number/extension/callflow/application routing, SIP domain +
credential provisioning, outgoing caller IDs (raw HTTP until the SDK wraps
them), SMS send/receive, webhook signature validation.

Not yet implemented:

- **Softphone keypad / transfer UI** — the JsSIP client (vendored in
  `static/src/lib/jssip.min.js`) registers and answers, but there is no
  dialpad, recents or transfer flow yet.
- **OutgoingCallerIds / ValidationRequests / Balance** — served by VoiceML but
  not yet wrapped by `voiceml-python-sdk`; the module talks to the first two
  over raw HTTP and omits Balance.
- **WhatsApp** — VoiceML messaging is SMS/MMS only.
- Recording start/stop controls and blind transfer (Twilio-specific APIs with
  no direct VoiceML SDK counterpart yet).

## Verification

Two test layers, plus the live pass in `live-test.md`:

1. **Odoo tests** (needs an Odoo 19 instance):

   ```bash
   oduflow run_odoo_tests connect_voiceml
   # or: ./odoo-bin -d <db> -i connect_voiceml --test-enable --test-tags /connect_voiceml --stop-after-init
   ```

2. **REST contract test** (no Odoo, no VoiceML fleet — verifies every REST call
   the module makes against a mock server):

   ```bash
   PYTHONPATH=<path-to-voiceml-python-sdk>/src \
     python3 connect_voiceml/tools/rest_contract.py
   ```

   Requires `voiceml` + `httpx` + `pydantic` on `PYTHONPATH`. It asserts the
   exact HTTP method, path (`.json` suffix, SIP and routes-v2 sub-paths), Basic
   auth, and form field names for all 23 requests.
