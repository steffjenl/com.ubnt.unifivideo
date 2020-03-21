'use strict';

const Homey = require('homey');

class StandaloneDriver extends Homey.Driver {

    onInit() {
        this.log('Driver initialized.');
    }

}

module.exports = StandaloneDriver;