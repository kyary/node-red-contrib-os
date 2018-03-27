/**
 * Copyright 2016 Argonne National Laboratory.
 *
 * Licensed under the BSD 3-Clause License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    var settings = RED.settings;
    const os = require('os');
    const df = require('node-df');
    const fs = require('fs');
    const Promise = require('promise');
    const util = require('util');

    function OS(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            msg.payload = {
                hostname: os.hostname(),
                type: os.type(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                endianness: os.endianness(),
                tmpdir: os.tmpdir()
            };
            node.send(msg);
        });

    }

    RED.nodes.registerType("OS",OS);

    function Drives(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            df(function (error, response) {
                if (error) { throw error; }
                msg.payload = response;
                node.send(msg);
            });
        });

    }

    RED.nodes.registerType("Drives",Drives);

    function Uptime(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            msg.payload = {uptime: os.uptime()};
            node.send(msg);
        });
    }

    RED.nodes.registerType("Uptime",Uptime);

    function CPUs(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            msg.payload = {cpus: os.cpus()};
            node.send(msg);
        });
    }

    RED.nodes.registerType("CPUs",CPUs);

    function Loadavg(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            msg.payload = {loadavg: os.loadavg()};
            node.send(msg);
        });
    }

    RED.nodes.registerType("Loadavg",Loadavg);

    function Memory(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
          var tmem = os.totalmem();
          var fmem = os.freemem();
          var pmem = (100 - (fmem/tmem)*100).toFixed(2);
          msg.payload = {totalmem: tmem, freemem: fmem, memusage: pmem};
          if (os.platform() == 'linux') {
            MemoryLinux(node, msg);
          } else {
            node.send(msg);
          }
        });
    }

    function fetchData(path) {
        return new Promise(function(resolve, reject) {
            fs.readFile(path, 'utf8', (err, data) => {
                if(err) reject(err);
                resolve(data)
            });
        });
    }

    function MemoryLinux(node, msg) {
      const pattern = /^(\w+):\s+(\d+)/;
      const path = '/proc/meminfo';
      var dataPromise = fetchData(path);
      var memory = msg.payload;

      dataPromise.then(data => {
        memInfoLines = data.toString().split(/\n/g);
        for (var i = 0; i < memInfoLines.length; i++) {
          var line = memInfoLines[i];
          if (pattern.test(line)) {
            var key = RegExp.$1;
            memory[key] = parseInt(RegExp.$2, 10);
            if (line.endsWith('kB')) memory[key] = memory[key] * 1024;
          }
        }
        msg.payload = memory
        node.send(msg);
      }).catch(function(err) {
        node.error(err);
      });
    }

    RED.nodes.registerType("Memory",Memory);

    function NetworkIntf(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;

        node.on("input", function(msg) {
            msg.payload = {networkInterfaces: os.networkInterfaces()};
            node.send(msg);
        });
    }

    RED.nodes.registerType("NetworkIntf",NetworkIntf);
}
