"use strict";

importScripts("libs/comlink.js");

const Render_Thread = {
    async link(name, proxy) {
        if (name === 'window') {
            self.window = proxy;
        }
        if (name === 'document') {
            self.document = proxy;
        }
    },
    async start() {
        // console.log('start');
    },
    async windowEventFired(type, data) {
        // console.log('window', type, data);
    },
    async documentEventFired(type, data) {
        // console.log('document', type, data);
    }
};

Comlink.expose(Render_Thread);
