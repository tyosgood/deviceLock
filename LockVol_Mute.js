/**
 * Configure system to hide UI, sharing, turn on auto answer and lock volume and mute
 * Hold down the up (+) volume key for approx 10 sec to display the IP address on the screen for 30 sec
 * 
 * Author: Tyler Osgood - tyosgood@cisco.com
 */

import xapi from 'xapi';

const VOLUME = 50;
var counter = [];



function init() {
//initial lock down
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


//lock volume and mute
  xapi.Status.Audio.Volume.on((volume) => {
    xapi.Command.Audio.Volume.Set({ Level: VOLUME });
    if (volume > VOLUME) countVol();
    
  });
  xapi.Event.Audio.MicrophonesMuteStatus.on((value) => {
    if (value.Mute == "On"){ xapi.Command.Audio.Microphones.Unmute();
    
  }});

//listen for the message prompt to clear and then re-hide the UI
  xapi.Event.UserInterface.Message.Prompt.Cleared
    .on(value => {xapi.Config.UserInterface.OSD.Mode
          .set('Unobstructed')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);});})
  
}


//Hold down the up (+) volume key for approx 10 sec to display the IP address on the screen
function countVol() {
    let now = new Date();
    counter.push(now);
    
    if (counter.length >=100) {
        counter = counter.slice(-100);
        let diff = now - counter[0];
        
        if (diff <= 12000 && diff >= 9000) {
        
          displayIP();
    
           }
           counter.length=0;
    }
}




//Display IP address on screen for 30 sec
async function displayIP() {
const IP_addr = await xapi.Status.Network[1].IPv4.Address.get()

//we have to unhide the UI in order to show the IP address - UI gets re-hidden as soon as the prompt is dismissed 
 xapi.Config.UserInterface.OSD.Mode
          .set('Auto')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);});;

  xapi.Command.UserInterface.Message.Prompt.Display(
    { Title:'IP Address', Text: IP_addr, Duration: 30});
}

init();