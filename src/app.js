// import {FfmpegUtil} from "./FfmpegUtil";
const {ipcRenderer, remote} = require('electron')
const toBuffer = require('blob-to-buffer')
const {FfmpegUtil} = require('./FfmpegUtil')

let localStreams = {}
let microAudioStreams = {}
let recordedChunks = []
let numRecordedChunks = 0
let videoRecorders = {}
let includeMic = false
// let includeSysAudio = false
// let RTMP_SERVER='rtmp://122.51.98.45:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk'
// let RTMP_SERVER = 'rtmp://localhost:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk'

//instance ffmpeg
let ffmpegUtils = {};


document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#record-desktop').addEventListener('click', recordDesktop)
    document.querySelector('#record-camera').addEventListener('click', recordCamera)
    document.querySelector('#record-window').addEventListener('click', recordWindow)
    document.querySelector('#play-video').addEventListener('click', playVideo)
    document.querySelector('#micro-audio').addEventListener('click', microAudioCheck)
    // document.querySelector('#system-audio').addEventListener('click', sysAudioCheck)
    document.querySelector('#record-stop').addEventListener('click', stopRecording)
    document.querySelector('#play-button').addEventListener('click', play)
    document.querySelector('#download-button').addEventListener('click', download)
    //check default audio enable
    microAudioCheck();
})


const playVideo = async () => {
    //['openFile', 'multiSelections']
    const chosenFiles = await remote.dialog.showOpenDialog({properties: ['openFile']})
    if (chosenFiles && chosenFiles.canceled === false && chosenFiles.filePaths.length > 0) {
        let filename = chosenFiles.filePaths[0];
        console.log('open local file:' + filename)
        let video = document.querySelector('#video')
        video.muted = false
        video.src = filename
    }
}

const disableButtons = () => {
    document.querySelector('#record-desktop').disabled = true
    document.querySelector('#record-camera').disabled = true
    document.querySelector('#record-window').disabled = true
    document.querySelector('#record-stop').hidden = false
    document.querySelector('#play-button').hidden = true
    document.querySelector('#download-button').hidden = true
}

const enableButtons = () => {
    document.querySelector('#record-desktop').disabled = false
    document.querySelector('#record-camera').disabled = false
    document.querySelector('#record-window').disabled = false
    document.querySelector('#record-stop').hidden = true
    document.querySelector('#play-button').hidden = true
    document.querySelector('#download-button').hidden = true
}

//已废弃
const microAudioCheck = async () => {
    // includeSysAudio = false
    // document.querySelector('#system-audio').checked = false

    // Mute video so we don't play loopback audio.
    var video = document.querySelector('#video')
    video.muted = true
    includeMic = !includeMic
    if (includeMic)
        document.querySelector('#micro-audio-btn').classList.add('active');
    else
        document.querySelector('#micro-audio-btn').classList.remove('active');
    console.log('Audio =', includeMic)
    await getAllAudioDevices(true);
    return;

    if (includeMic) {
        //navigator.webkitGetUserMedia(  //Deprecated
        //    {audio: true, video: false},//audio: {deviceId:{exact: audDevice.deviceId}}
        //    getMicroAudio, getUserMediaError);
        //查找是否安装虚拟声卡
        // const virAudioStream = await findAudioDeviceIdByLabel(['VB-Cable (Virtual)', 'Soundflower (2ch)']);
        // const virAudioStream = await findAudioDeviceIdByLabel(['ulti-Output-H2 (Aggregate)']);//'Multi-Output Device (Aggregate)'
        // const virAudioStream = await findAudioDeviceIdByLabel(['Multi-Output-T2 (Aggregate)']);
        // const virAudioStream = await findAudioDeviceIdByLabel(['Multi-Output-T3 (Aggregate)']);
        const virAudioStream = await findAudioDeviceIdByLabel(['Soundflower (2ch)']);
        console.log('virtual audio card:', virAudioStream ? (virAudioStream.label + ':' + virAudioStream.deviceId) : '', virAudioStream);
        //virAudioStream=null;//test
        const audioStream = await navigator.mediaDevices.getUserMedia(
            //{audio: true, video: false},
            {audio: virAudioStream ? {deviceId: {exact: virAudioStream.deviceId}} : true, video: false}
        );
        getMicroAudio(audioStream);
    }
}


const findAudioDeviceIdByLabel = async (labels, excludeDefault = false) => {
    //Soundflower (2ch),VB-Cable (Virtual)
    labels = Array.isArray(labels) ? labels : [labels];
    const audioDevices = await getAllAudioDevices();
    let targetDevices = audioDevices.filter(device => {
        device.winDeviceId = getWinDeviceIdByLabel(device.label);
        return device.kind == "audiooutput" && (!excludeDefault || device.deviceId != "default") && (labels.includes(device.label) || labels.includes(device.winDeviceId))
    });
    return targetDevices.length > 0 ? targetDevices[0] : false;
}


const getWinDeviceIdByLabel = (labelName) => {
    return labelName.split('(').length > 1 ? labelName.split('(')[0].trim() : labelName;
}


const getAllAudioDevices = async (debugOutput = false) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audiooutput');
    debugOutput && console.log('all audioDevices(debug):', audioDevices);
    return audioDevices;
}


// function sysAudioCheck () {
// // Mute video so we don't play loopback audio
// var video = document.querySelector('#video')
// video.muted = true

// includeSysAudio = !includeSysAudio
// includeMic = false
// document.querySelector('#micro-audio').checked = false
// console.log('System Audio =', includeSysAudio)
// };

const cleanRecord = () => {
    let video = document.querySelector('#video');
    video.controls = false;
    recordedChunks = []
    numRecordedChunks = 0
    //startFfmpge();
}

ipcRenderer.on('source-id-selected', (event, sourceId) => {
    // Users have cancel the picker dialog.
    if (!sourceId || sourceId.length < 1) return
    //console.log(sourceId)
    onAccessApproved(sourceId)
})

const recordDesktop = () => {
    cleanRecord()
    ipcRenderer.send('show-picker', {types: ['screen']})
}

const recordWindow = () => {
    cleanRecord()
    ipcRenderer.send('show-picker', {types: ['window']})
}

const recordCamera = () => {
    cleanRecord()
    navigator.webkitGetUserMedia({  //Deprecated
        //navigator.webkitGetUserMedia({
        audio: false,
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    }, getMediaStream, getUserMediaError)
}

//每隔0.5秒录屏器抓取到的分段视频数据流
const recorderOnDataAvailable = (event, winId) => {
    if (event.data && event.data.size > 0) {
        //split piece for total save
        recordedChunks.push(event.data)
        numRecordedChunks += event.data.byteLength
        //data to ffmpge,convert and send to rtmp server
        //let arrayBufferData = await event.data.arrayBuffer();
        toBuffer(event.data, function (err, bufferData) {
            if (err) {
                throw err;
            }
            if (winId in ffmpegUtils) {
                ffmpegUtils[winId].sendToRtmp(bufferData);
            }
        })
    }
}

const stopRecording = async () => {
    console.log('Stopping record and starting download')
    enableButtons()
    document.querySelector('#play-button').hidden = false
    document.querySelector('#download-button').hidden = false
    //停止所有录屏器
    for (let key in videoRecorders) {
        videoRecorders[key].stop()
    }
    //停止所有ffmpeg
    for (let key in ffmpegUtils) {
        ffmpegUtils[key].stopRtmp()
        localStreams[key].getVideoTracks()[0].stop()
    }
    //stop stream write into ffmpeg
    await sleepSyncPromise(1500);
    //stopFfmpge()
}

function sleepSyncPromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const play = () => {
    // Unmute video.
    let video = document.querySelector('#video')
    video.controls = true;
    video.muted = false
    let blob = new Blob(recordedChunks, {type: 'video/webm'})
    video.src = window.URL.createObjectURL(blob)
    //not work for src attr
}

const download = () => {
    let blob = new Blob(recordedChunks, {type: 'video/webm'})
    let url = URL.createObjectURL(blob)
    let a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'recorder-test.webm'
    a.click()
    setTimeout(function () {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }, 100)
}

const getMediaStream = async (stream, winId, audioDeviceName = 'default') => {
    //find wether video tag exist
    let videoAttrKey = 'video:' + winId;
    if ($("video[tagId='" + videoAttrKey + "']").length < 1) {
        //dyn create video tag
        $('#videoList').append('<video tagId="' + videoAttrKey + '" controls class="video-js" data-setup="{}" autoplay></video>');
    }
    //let video = document.querySelector('#video')
    let video = $("video[tagId='" + videoAttrKey + "']").get(0);
    //var CompatibleURL = window.URL || window.webkitURL;
    //video.src = URL.createObjectURL(stream)
    //play with h5 video
    video.srcObject = stream;
    //todo:localStream可能需要定义多个
    localStreams[winId] = stream
    stream.onended = () => {
        console.log('Media stream ended:', winId)
    }

    //no use
    //let videoTracks = localStream.getVideoTracks()

    //add audio support
    if (includeMic) {
        microAudioStreams[winId] = await tryFetchMicroAudioDevice(audioDeviceName);
        console.log('Adding audio track(' + audioDeviceName + '):', winId)
        let audioTracks = microAudioStreams[winId].getAudioTracks()
        localStreams[winId].addTrack(audioTracks[0])
        //stream.addTrack(audioTracks[0])
    }
    // if (includeSysAudio) {
    // console.log('Adding system audio track.')
    // let audioTracks = stream.getoAudioTracks()
    // if (audioTracks.length < 1) {
    // console.log('No audio track in screen stream.')
    // }
    // } else {
    // console.log('Not adding audio track.')
    // }
    try {
        console.log('Start recording the stream:', winId)
        //recorder = new MediaRecorder(stream)
        //convert to h264 for rtmp
        videoRecorders[winId] = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=h264',
            audioBitsPerSecond: 44100,  // 44.1kHz
            videoBitsPerSecond: 3000000 // 3000k 画质
        })
    } catch (e) {
        console.assert(false, 'Exception while creating MediaRecorder: ' + e, winId)
        return
    }
    videoRecorders[winId].ondataavailable = (event) => {
        recorderOnDataAvailable(event, winId);
    }
    videoRecorders[winId].onstop = () => {
        console.log('recorderOnStop fired:', winId)
    }
    //recorder.start()
    videoRecorders[winId].start(500)
    console.log('Recorder is started:', winId)
    disableButtons()
}

//已废弃
const getMicroAudio = (stream) => {
    console.log('Received audio stream.')
    microAudioStreams = stream
    console.log('check audio devices:' + microAudioStreams.getAudioTracks().length)
    console.log('check audio devices.0:' + microAudioStreams.getAudioTracks()[0].label)
    console.log('check audio devices.info:', microAudioStreams.getAudioTracks()[0], microAudioStreams.getAudioTracks()[0].getSettings())
    stream.onended = () => {
        console.log('Micro audio ended.')
    }
}


const tryFetchMicroAudioDevice = async (audioDeviceName = 'default') => {
    // includeSysAudio = false
    // document.querySelector('#system-audio').checked = false

    // Mute video so we don't play loopback audio.
    var video = document.querySelector('#video')
    video.muted = true
    if (includeMic) {
        //navigator.webkitGetUserMedia(  //Deprecated
        //    {audio: true, video: false},//audio: {deviceId:{exact: audDevice.deviceId}}
        //    getMicroAudio, getUserMediaError);
        //查找是否安装虚拟声卡
        // const virAudioStream = await findAudioDeviceIdByLabel(['VB-Cable (Virtual)', 'Soundflower (2ch)']);
        // const virAudioStream = await findAudioDeviceIdByLabel(['ulti-Output-H2 (Aggregate)']);//'Multi-Output Device (Aggregate)'
        // const virAudioStream = await findAudioDeviceIdByLabel(['Multi-Output-T2 (Aggregate)']);
        // const virAudioStream = await findAudioDeviceIdByLabel(['Multi-Output-T3 (Aggregate)']);
        const virAudioStream = await findAudioDeviceIdByLabel([audioDeviceName]);
        console.log('virtual audio card find result:', virAudioStream ? (virAudioStream.label + ':deviceId:' + virAudioStream.deviceId + ':groupId:' + virAudioStream.groupId) : false, virAudioStream);
        //virAudioStream=null;//test
        const audioStream = await navigator.mediaDevices.getUserMedia(
            //{audio: true, video: false},
            {
                audio: virAudioStream ? (isRunInWin() ? {groupId: {exact: virAudioStream.groupId}} : {deviceId: {exact: virAudioStream.deviceId}}) : true,
                video: false
            }
        );
        //console.log('Received audio stream:',audioStream)
        console.log('navigator.mediaDevices.getUserMedia=>result:', audioStream.getAudioTracks().length, audioStream.getAudioTracks()[0], audioStream.getAudioTracks()[0].getSettings())
        audioStream.onended = () => {
            console.log('Micro audio ended.')
        }
        return audioStream;
    }
    return null;
}


const isRunInWin = () => {
    console.log('os:' + process.platform);
    return 'win32' === process.platform;
}


const getUserMediaError = (p1) => {
    console.log('getUserMedia() failed:' + p1.message)
}

const onAccessApproved = (winInfos) => {
    //convert to array
    winInfos = Array.isArray(winInfos) ? winInfos : [winInfos];
    if (winInfos.length < 1) {
        console.log('Access rejected: no window ids')
        return
    }
    console.log('Window IDS: ', winInfos)
    //support record mult windows
    winInfos.forEach((winInfo) => {
        //解析各参数
        let winId = winInfo.split('|')[0];
        let audioDeviceName = winInfo.split('|')[1];
        let rtmpServUrl = winInfo.split('|')[2];

        //初始化FfmpegUtil对象并启动
        ffmpegUtils[winId] = new FfmpegUtil(winInfo, rtmpServUrl, audioDeviceName);
        ffmpegUtils[winId].startRtmp();

        console.log('Start recorder for Window ID: ', winInfos)
        navigator.webkitGetUserMedia({  //Deprecated
            //navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: winId,
                    maxWidth: window.screen.width,
                    maxHeight: window.screen.height,
                    //maxFrameRate: 25,
                }
            }
        }, (streamData) => {
            getMediaStream(streamData, winId, audioDeviceName)
        }, (param) => {
            getUserMediaError(param, winId)
        })
    });

}
