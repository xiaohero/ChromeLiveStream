/**Ffmpeg工具类**/
const {spawn} = require('child_process');

class FfmpegUtil {
    //定义静态类属性:方案1
    static RTMP_SERVER = 'rtmp://localhost:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk';
    //定义静态类属性:方案2(外部可访问)
    // static get RTMP_SERVER() {
    //     return 'rtmp://122.51.98.45:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk';
    // }

    //构造函数（new对象的时候调用一次）与析构函数(销毁对象是调用一次)
    constructor(name = '', rtmpServer = '', audioDeviceName = 'default', ffmpegPath = '') {
        //this.globalSenders = {};
        //this.curSender = null;
        //this.initListenEvent();
        this.ffmpegPath = ffmpegPath;
        this.name = name;
        this.ffmpeg = null;
        this.audioDeviceName = audioDeviceName;
        this.sox = null;
        this.rtmpServer = rtmpServer ? rtmpServer : FfmpegUtil.RTMP_SERVER;
    }

    startMp4(mp4FilePath) {

    }

    stopMp4() {

    }

    startRtmp() {
        //this.rtmpServer = rtmpAddr ? rtmpAddr : (this.rtmpServer ? this.rtmpServer : FfmpegUtil.RTMP_SERVER);
        if (this.ffmpeg) {
            console.log(this.name + ':' + 'ffmpeg already started!')
            return true;
        }
        console.log(this.name + ':' + 'Starting ffmpeg:')
        try {
            this.ffmpeg = spawn('ffmpeg', [
                '-y',
                // read audio from sox wav
                //'-i', '/Users/forest/Workspace/node/electron-proj/AudioPick/test1.wav',
                // read video stream from stdin
                '-i', '-',
                //"-r", videoFps,
                // may need convert to H.264 codec(options:libx264)
                // "-vcodec", "libx264",
                '-vcodec', 'copy',
                // audio convert
                '-acodec', 'aac',
                // output flv format
                '-f', 'flv',
                // send to rtmp server
                this.rtmpServer
            ]);
            //-V6  -r 44100 -c 2 -e s -t coreaudio "Soundflower (2ch)"
            /*
            this.sox = spawn('sox', [
                '-V6',
                '-r 44100',
                '-c 2',
                '-e s',
                '-t coreaudio "' + this.audioDeviceName + '"',
                '-'
            ]);*/
            //console.log(this.name + ':' + 'Starting sox:')
        } catch (e) {
            console.log(this.name + ':' + 'Starting ffmpeg error:' + this.name, e)
            return false;
        }
        this.ffmpeg.stdout.on('data', data => {
            console.log(this.name + ':' + `ffmpeg stdout info: ${data}`);
        });
        this.ffmpeg.stderr.on('data', data => {
            console.log(this.name + ':' + `ffmpeg stderr info: ${data}`);
        });
        /*
        //sox log output
        this.sox.stdout.on('data', data => {
            console.log(this.name + ':' + `(${this.audioDeviceName})sox stdout info: ${data}`);
        });
        this.sox.stderr.on('data', data => {
            console.log(this.name + ':' + `(${this.audioDeviceName})sox stderr info: ${data}`);
        });
        */
        return true;
    }


    sendToRtmp(streamData) {
        if (!this.ffmpeg) {
            console.log(this.name + ':' + 'ffmpeg: sync data to rtmp server fail,ffmpeg has stoped!');
            return false;
        }
        return this.ffmpeg.stdin.write(streamData);
        //console.log(this.name+':'+'ffmpeg: sync data to rtmp server:' + this.rtmpServer);
    }

    async stopRtmp() {
        if (!this.ffmpeg) {
            return false;
        }
        //stop stdin write
        this.ffmpeg.stdin.end();
        this.ffmpeg.stdin.destroy();
        //ffmpeg.stdin.close();//end()
        //await this.sleepSyncPromise(200);
        this.ffmpeg.stdin.pause();
        let ret = this.ffmpeg.kill();
        this.ffmpeg = null;
        console.log(this.name + ':' + 'Stopping ffmpeg!', ret);
        /*
        //sox kill
        this.sox.kill();
        //ffmpeg.kill('SIGINT');
        this.sox = null;
         */
        return true;
    }

    sleepSyncPromise(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

//ES6导出语法
// export {FfmpegUtil};
//CommonJS 导出语法
module.exports = {FfmpegUtil}
//sox -V6  -r 44100 -c 2 -e s -t coreaudio "Soundflower (2ch)"  test1.wav
//http://rpm.pbone.net/index.php3/stat/45/idpl/29638255/numer/7/nazwa/soxformat
/*
///////////local test
Soundflower (2ch)   rtmp://127.0.0.1:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://127.0.0.1:7002/live/movie.m3u8

Soundflower (64ch)  rtmp://127.0.0.1:2935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://127.0.0.1:2002/live/movie.m3u8

VB-Cable (Virtual)  tmp://127.0.0.1:3935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://127.0.0.1:3002/live/movie.m3u8

**** win
VoiceMeeter Input (VB-Audio VoiceMeeter VAIO)          rtmp://127.0.0.1:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
VoiceMeeter Aux Input (VB-Audio VoiceMeeter AUX VAIO)  rtmp://127.0.0.1:2935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk

///////////online test
Soundflower (2ch)   rtmp://47.116.26.253:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://47.116.26.253:7002/live/movie.m3u8

Soundflower (64ch)  rtmp://47.116.26.253:2935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://47.116.26.253:2002/live/movie.m3u8

VB-Cable (Virtual)  tmp://47.116.26.253:3935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
http://47.116.26.253:3002/live/movie.m3u8

**** win
VoiceMeeter Input (VB-Audio VoiceMeeter VAIO)          rtmp://47.116.26.253:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
VoiceMeeter Aux Input (VB-Audio VoiceMeeter AUX VAIO)  rtmp://47.116.26.253:2935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk
*/
