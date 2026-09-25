# -*- coding: utf-8 -*-
"""X-Twilio-Signature validation for VoiceML webhooks.

VoiceML signs inbound webhooks exactly like Twilio: HMAC-SHA1 over the full
request URL (scheme + host + path + query) concatenated with the POST body
parameters, sorted by key and concatenated key+value without separators. The
secret is the tenant's API key (the same value the VoiceML SDK calls
``api_key`` / ``auth_token``). No ``twilio`` dependency is required.
"""

import base64
import hashlib
import hmac
from urllib.parse import urlencode


def _sorted_form(params):
    """Return the sorted ``key + value`` concatenation Twilio signs."""
    return ''.join(
        '{}{}'.format(key, value)
        for key, value in sorted(params.items())
        if value != ''
    )


def sign_request(url, params, secret):
    """Compute the X-Twilio-Signature value for ``url`` and form ``params``."""
    payload = url + _sorted_form(params)
    mac = hmac.new(
        secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha1
    )
    return base64.b64encode(mac.digest()).decode('utf-8')


def valid_request(url, params, signature, secret):
    """Compare a presented signature against the recomputed one.

    Constant-time comparison to avoid timing side channels.
    """
    if not signature or not secret:
        return False
    expected = sign_request(url, params, secret)
    return hmac.compare_digest(expected, signature)


def normalize_url(url):
    """VoiceML (like Twilio) signs an https URL; an http deployment is an
    operator misconfiguration, so mirror Twilio's effective scheme for
    validation while still failing closed otherwise."""
    return url.replace('http:', 'https:')
