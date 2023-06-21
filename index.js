const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const ytdl = require("ytdl-core");
const fs = require("fs");
const cp = require("child_process");

const http = require("http");
const server = http.createServer();
ffmpeg.setFfmpegPath(ffmpegStatic);

let url = `https://youtu.be/KUpwupYj_tY`;

let video = ytdl(url, {
    filter: function (format) {
        console.log(format.quality + " Size " + format.contentLength / 1024 / 1024)
        let d = format.quality == 'hd2160';
        return d;
    }
});
let audio = ytdl(url, {
    filter: function (format) {
        let d = format.audioQuality == "AUDIO_QUALITY_MEDIUM";
        return d;
    },
});

let ffmpegProcess = cp.spawn(
    ffmpegStatic,
    [
        "-loglevel", "8", "-hide_banner",
        "-i", "pipe:3", "-i", "pipe:4",
        "-map", "0:a", "-map", "1:v",
        "-c", "copy", "-f", "matroska", "pipe:5",
    ],
    {
        windowsHide: true,
        stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
    }
);
audio.pipe(ffmpegProcess.stdio[3]);
video.pipe(ffmpegProcess.stdio[4]);
let d = ffmpegProcess.stdio[5]

ffmpeg()
    .input(ffmpegProcess.stdio[5])
    .saveToFile("video.mp4")
    .on("start", function (commandLine) {
        cmd = commandLine;
        console.log("Start ...");
    })

    .on("progress", () => {
        fs.stat("video.mp4", (err, fileStatus) => {
            if (err) console.log(err);
            else {
                console.log("Completed size : " + Math.floor(fileStatus.size / 1000000)+' Mb');
            }
        });
    })
    .on("end", () => {
        console.log("Video Saved Successfully...!");
    })
    .on("error", (error) => {
        console.error(error);
    });
