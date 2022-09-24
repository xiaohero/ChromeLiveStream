# ChromeLiveStream ([English introduction](https://github.com/xiaohero/ChromeLiveStream/blob/master/README.en.md)) (web screen recording and live streaming project based on electron+ffmpeg)

#### introduce
* ChromeLiveStream is a web screen recording based on electron+ffmpeg, which is developed based on [electron-screen-recorder](https://github.com/hokein/electron-screen-recorder).
* Its main functions include the following:
  * Support real-time video recording of browser web pages and any running windows.
  * Support camera screen recording, system screen recording.
  * Support real-time audio recording of web window.
  * Supports transcoding of recorded video and audio data streams (transcoding via ffmpeg)
  * Support recorded video to rtmp live stream for online playback (you need to build your own rtmp streaming server)
  * Support real-time preview playback of recorded video, download and save
  * Unique enhancements:
    * Support to record audio and video of multiple windows at the same time, and separate audio recording.
    * Support web page, video and audio separation recording technology of different web pages (after various difficult attempts, Google technical search, finally completed)
      * For example, the browser opens 2 video websites at the same time: website A plays video a, website B plays video b, this tool can record two videos a and b at the same time, and separate the audio of a and b to make them record independently (generally When we play two website videos at the same time, the audio will definitely be confused and overlap)
      * Separate audio from different web pages, without relying on multiple sound card insertion, we simulate "virtual sound card technology" through software (such as [VB-Cable](https://vb-audio.com/Cable/)) It can create multiple Virtual sound card.


#### Software Architecture and Principles
* When ChromeLiveStream is running, use electron to read all the window handles in the current system for selection.
* ChromeLiveStream will load the AudioPick Google extension (which allows users to output audio to different audio devices according to different webpage windows).
* After the user selects the specified window, call the h5 screen recording api to start the recording of the video stream, and at the same time call the audio reading interface of h5 to obtain all the output audio devices of the current operating system.
* When the user selects multiple windows to record video and audio at the same time, separate different web pages and output to different audio devices (virtual audio) through AudioPick to achieve the effect of separate audio recording.


#### Installation and usage tutorial
* npm install
* npm start