/**
 * Lock volume to a predefined value and disable mute
 * and lock down the device
 */

import xapi from 'xapi';

const VOLUME = 50;



function init() {
xapi.Config.UserInterface.OSD.Mode
    .set('Unobstructed')
    .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);});

xapi.Config.Conference.AutoAnswer.Mode
    .set('On')
    .catch((error) => { console.error('Config.Conference.AutoAnswer.Mode: ' + error);});

xapi.Config.Video.Input.Connector[2].PresentationSelection
    .set('Manual')
    .catch((error) => { console.error('Config.Video.Input.Connector[2].PresentationSelection: ' + error);});

xapi.Config.Video.Input.Connector[3].PresentationSelection
    .set('Manual')
    .catch((error) => { console.error('Config.Video.Input.Connector[3].PresentationSelection: ' + error);});
 
  
}


function lockVol(){
  xapi.Status.Audio.Volume.on((volume) => {
    xapi.Command.Audio.Volume.Set({ Level: VOLUME });
    if (volume != 50) countVol();
    //console.log(`Volume changed to: ${volume}`);
  });
  xapi.Event.Audio.MicrophonesMuteStatus.on((value) => {
    if (value.Mute == "On"){ xapi.Command.Audio.Microphones.Unmute();
    //console.log(value.Mute);
  }});

}

init();
lockVol();