"use strict";

import * as Comlink from "./libs/comlink.mjs";
import StorageManager from "./rpg_managers/StorageManager.js";

class Data_Thread {
    static async start() {}
};

Comlink.expose(Data_Thread);
