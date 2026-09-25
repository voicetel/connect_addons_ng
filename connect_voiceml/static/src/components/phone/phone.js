/** @odoo-module **/
// VoiceML softphone — a SIP-over-WebRTC client backed by JsSIP.
//
// This is the functional skeleton of the browser phone. It differs from
// connect_twilio's `Twilio.Device` phone in exactly one load-bearing way:
// it registers a JsSIP UA against the VoiceML OpenSIPS WSS edge using the
// SIP credentials the module provisions (connect.user.get_phone_config),
// instead of a Twilio Voice JS SDK device + JWT VoiceGrant.
//
// TODO(connect_voiceml): vendor the jssip dist (jssip.min.js) into
// static/src/lib/ and add it to the manifest's web.assets_backend bundle.
// Until then this component registers nothing and reports why.
import { loadJS } from "@web/core/assets";
import { Component, useState, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

const LOG_PREFIX = "[Connect VoiceML]";
const clog = (...args) => console.log(LOG_PREFIX, ...args);

export class VoiceMLPhone extends Component {
    static template = "connect_voiceml.phone";

    setup() {
        this.orm = useService("orm");
        this.state = useState({ registration: "idle", uri: "", error: "" });
        onMounted(this._start.bind(this));
    }

    async _fetchConfig() {
        try {
            const cfg = await this.orm.call("connect.user", "get_phone_config", []);
            return cfg;
        } catch (err) {
            this.state.error = "Could not load softphone configuration.";
            clog("config error", err);
            return { ok: false };
        }
    }

    async _start() {
        const cfg = await this._fetchConfig();
        if (!cfg || !cfg.ok) {
            this.state.registration = "disabled";
            return;
        }
        this.state.uri = cfg.uri;
        if (typeof JsSIP === "undefined") {
            this.state.registration = "missing-js";
            this.state.error =
                "JsSIP is not vendored yet — see static/src/js/utils.js.";
            return;
        }
        this._register(cfg);
    }

    _register(cfg) {
        const socket = new JsSIP.WebSocketInterface(cfg.wss_url);
        this.ua = new JsSIP.UA({
            sockets: [socket],
            uri: `sip:${cfg.uri}`,
            authorization_user: cfg.username,
            password: cfg.password,
            realm: cfg.realm,
        });
        this.ua.on("registered", () => {
            this.state.registration = "registered";
            clog("registered as", cfg.uri);
        });
        this.ua.on("unregistered", () => {
            this.state.registration = "unregistered";
        });
        this.ua.on("registrationFailed", () => {
            this.state.registration = "failed";
        });
        this.ua.start();
    }
}
