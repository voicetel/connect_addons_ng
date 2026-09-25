/** @odoo-module **/
// VoiceML softphone component scaffold.
//
// TODO(connect_voiceml): replace with a real OWL softphone component that:
//   - fetches connect.user.get_phone_config() on mount,
//   - registers a JsSIP UA against the OpenSIPS WSS edge,
//   - renders call controls / recents / favorites (mirror connect_twilio's
//     static/src/components/phone/* tree, substituting JsSIP for
//     twilio.min.js).
export class VoiceMLPhone {
    constructor(env) {
        this.env = env;
    }
}
