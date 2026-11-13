const uuid = require("uuid");
const fs = require("fs");
const compress_images = require("compress-images");
const { Consts } = require("../consts");
const { HelperFunction } = require("./helper_function");
const { Security } = require("./security");
const sharp = require('sharp');

class HelperFile {



    static compressImage(source, destination) {
        let full_source = `private/${source}/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`;
        let full_destination = `private/${destination}/`;
        compress_images(
            full_source,
            full_destination, { compress_force: false, statistic: true, autoupdate: true },
            false, { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } }, { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } }, { svg: { engine: "svgo", command: "--multipass" } }, {
            gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
        },
            function (err, completed) {
                if (completed === true) {
                    HelperFile.clear_files_from_directory(source);
                }
            },
            function (error, completed, statistic) { }
        );
    }

    static clear_files_from_directory(directory_path) {
        let inputPath = `private/${directory_path}/`;
        fs.readdir(inputPath, (err, files) => {
            if (files.length > 0) {
                files.forEach((file) => {
                    fs.unlinkSync(inputPath + file);
                });
            }
        });
    }

    static isMp4Video(file) {
        let extension = this.getExtension(file.name);
        return extension == "mp4";
    }

    static is_image(file) {
        let extension = this.getExtension(file.name);
        extension = extension.toLowerCase();
        return extension == 'jpeg' || extension == 'jpg' || extension == 'png' || extension == 'svg' || extension == 'gif' || extension == 'webp'
    }


    static fileExceed10M(file) {
        return file.size > 10000000;
    }


    static fileExceed1G0(file) {
        return file.size > 1000000000;
    }
    static fileExceed30M(file) {
        return file.size > 30000000;
    }

    static uid() {
        return Security.get_random_string().substring(0, 9);
    }


    static upload_file(file) {
        let nameFile = `file_${this.uid()}${HelperFunction.generate_unique_id_from_time()}.${this.getExtension(file.name)}`;
        file.mv(`./private/files/${nameFile}`, function (err) {
            if (err) {
                console.log(err);
                return;
            }
        });
        return nameFile;
    }

    static upload_avatar(file) {
        let nameFile = `file_${this.uid()}${HelperFunction.generate_unique_id_from_time()}.${this.getExtension(file.name)}`;
        file.mv(`./public/images/temp/${nameFile}`, (err) => {
            if (err) {
                console.log(err);
                return;
            }

            this.#compress_avatar(nameFile, `./public/images/temp/${nameFile}`)
        });

        return `${Consts.HOST}:${Consts.PORT}/images/avatars/${nameFile}`;
    }

    static #compress_avatar(file_name, image_path) {
        sharp(image_path)
            .resize(150)
            .png({ progressive: true, quality: 10 })
            .toFile(`./public/images/avatars/${file_name}`)
            .then(data => {
                HelperFile.remove_file(`public/images/temp/${file_name}`);
                console.log("Thumbnail generated!");
            })
            .catch(err => { console.log(err) });
    }

    static upload_image(file) {
        let nameFile = `file_${this.uid()}${HelperFunction.generate_unique_id_from_time()}.${this.getExtension(file.name)}`;
        file.mv(`./private/images/${nameFile}`, (err) => {
            if (err) {
                console.log(err);
                return;
            }

            this.#generate_thumbnail(nameFile, `./private/images/${nameFile}`)
        });

        return {
            high_res: nameFile,
            low_res: nameFile
        };

    }

    static #generate_thumbnail(file_name, image_path) {
        sharp(image_path)
            .resize(50)
            .png({ progressive: true, quality: 10 })
            .toFile(`./private/image_thumbnails/${file_name}`)
            .then(data => {
                console.log("Thumbnail generated!");
            })
            .catch(err => { console.log(err) });
    }

    static deleteFileFromServer(fileURL) {
        let folderpath = this.getFileFolderFromURL(fileURL);
        fs.unlink(folderpath, (err) => {
            if (err) {
                console.error(err);
                return 1;
            }
        });
    }


    static getFileFolderFromURL(url) {
        url = url.split("//");
        url = url[1];
        url = url.split("/");
        url.shift();
        url.unshift("private")
        url = url.join("/");
        return url;
    }

    static getExtension(url) {
        url = url.split(".");
        return url[url.length - 1];
    }

    static is_aac_file(file) {
        let extension = this.getExtension(file.name);
        console.log("Extension", extension);
        return extension == "aac";
    }

    static remove_file(file_url) {
        try {
            fs.unlinkSync(file_url);
        } catch (error) {
            console.log("File not exist!");
        }
       
    }
}


module.exports.HelperFile = HelperFile;