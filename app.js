const express = require('express');
const app = express();
const Docker = require('dockerode');
const docker = new Docker();

const images_config = {
    "site": {
        "repo": "djbnjack/film-avond:latest",
        "name": "site-film",
        "start": "docker run -d -p 8888:8080 djbnjack/film-avond:latest"
    },
    "demo": "DJBnJack/demo"
};

let pullImage = async function(image) {
    return new Promise((resolve, reject) => {
        docker.pull(image, function(err, stream) {
            if (err) {
                console.log(err);
            } else {
                docker.modem.followProgress(
                    stream, 
                    (err, output) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(output);
                        }
                    }, 
                    (event) => {
                        console.log(event);
                    }
                );
            }
        });
    });
};

let killImage = async function(name) {
    return new Promise((resolve, reject) => {
        var opts = {};
        opts["filters"] = {
            "name": [
                name
            ]
        };
        docker.listContainers(opts, function (err, containers) {
            if (err) {
                reject();
            } if (containers.length === 0) {
                resolve();
            } else {
                containers.forEach(function (containerInfo) {
                    docker.getContainer(containerInfo.Id).stop(() => {
                        resolve();
                    });
                });
            }
        });
    });
};

let startImage = async function(image, name, start) {
    return new Promise((resolve, reject) => {
        console.log(name);
        console.log(start);
        if (name === "site-film") {
            docker.run(image, null, process.stdout, function (err, data, container) {
                console.log(data.StatusCode);
                resolve("Ok" + container);
            });
        } else {
            reject("Not OK");
        }
    });

    /*
    */
};

let getImageHandler = async function(req, res) {
    if (images_config[req.params.image] === undefined) {
        res.status(404).send("No config for " + req.params.image);
        return;
    }

    res.send("ok");
    let config = images_config[req.params.image];
    try {
        await pullImage(config.repo);
        await killImage(config.name);
        await startImage(config.repo, config.name, config.start);

    } catch (error) {
        console.error(error);
    }
};

app.get('/restart/:image', getImageHandler);

app.listen(8080);