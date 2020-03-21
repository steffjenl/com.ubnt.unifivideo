'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const base64 = require('base-64');

class Standalone extends Homey.Device {

    async onInit() {
        this._data = this.getData();
        this._settings = this.getSettings();

        // Register images
        await this._registerSnapshotImage();
    }

    /**
     * Method that registers a snapshot image and calls setCameraImage.
     * @private
     */
    async _registerSnapshotImage() {
        // get fresh set off settings from Homey
        this._settings = this.getSettings();

        let ipAddress = this._settings.ipAddress;
        let userName = this._settings.userName;
        let passWord = this._settings.passWord;
        let authString = userName + ':' + passWord;

        if (ipAddress === '' || userName === '' || passWord === '')
        {
            return;
        }
        this._snapshotImage = new Homey.Image();

        // Set stream, this method is called when image.update() is called
        this._snapshotImage.setStream(async (stream) => {

            const body = {
                username: userName,
                password: passWord
            };


            const headers1 = {
                "Host": ipAddress,
                "Content-Type": "application/json",
            };

            const options1 = {
                method: "POST",
                body:    JSON.stringify(body),
                headers: headers1
            };

            let authCookie = null;
            let jsonData = null

            this.log('Test');

            // Fetch image from url and pipe
            const res2 = fetch('http://192.168.178.218/api/1.1/login', options1)
                .then(res => res.json())
                .then(json => jsonData = json)
                .catch(error => this.error(error));

            this.log(jsonData);


            this.log(res2.headers.raw()['set-cookie']);

            if (!res2.ok) {
                this.error('_registerSnapshotImage() -> setStream -> failed', res2.statusText);
                throw new Error('Could not fetch image');
            }



            let fullUrl = 'http://' + userName + ':' + passWord + '@' + ipAddress + '/snap.jpeg';


            if (!fullUrl) {
                this.error('_registerSnapshotImage() -> setStream ->', 'failed no image url available');
                throw new Error('No image url available');
            }

            this.log('_registerSnapshotImage() -> setStream ->', fullUrl);

            const headers = {
                "Host": ipAddress,
                "Content-Type": "*/*",
                "Cookie": authCookie
            };

            const options = {
                method: "GET",
                headers: headers
            };

            // Fetch image from url and pipe
            const res = await fetch(fullUrl, options);
            if (!res.ok) {
                this.error('_registerSnapshotImage() -> setStream -> failed', res.statusText);
                throw new Error('Could not fetch image');
            }

            this.log('_registerSnapshotImage() -> setStream ->', fullUrl);

            res.body.pipe(stream);
        });

        // Register and set camera iamge
        return this._snapshotImage.register()
            .then(() => this.log('_registerSnapshotImage() -> registered'))
            .then(() => this.setCameraImage('snapshot', 'Snapshot', this._snapshotImage))
            .catch(this.error);
    }
}

module.exports = Standalone;
