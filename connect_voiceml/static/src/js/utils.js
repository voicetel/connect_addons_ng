/** @odoo-module **/
// VoiceML softphone helpers.
//
// TODO(connect_voiceml): this scaffold carries no SIP client yet. The web
// phone is a JsSIP (SIP-over-WebRTC) client, unlike connect_twilio's
// twilio.min.js device. Wiring plan:
//   1. Vendor the jssip dist (and a small ringtone set) into
//      static/src/lib/.
//   2. On phone init, RPC `connect.user.get_phone_config()` to fetch
//      {username, password, domain, wss_url, uri, ...}.
//   3. `new JsSIP.UA({sockets:[{uri: wss_url}], uri: 'sip:'+uri,
//      authorization_user: username, password})`, then
//      `ua.register()`.
//   4. Outbound click-to-call stays server-side via
//      connect.settings.originate_call() — the softphone itself only
//      handles the SIP registration + audio, not the routing.
export function normalizeNumber(number) {
    if (!number) return number;
    return String(number).replace(/[\s()\-+]/g, '').replace(/^0+/, '');
}
