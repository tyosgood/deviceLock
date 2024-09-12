/**
 * Configure system to hide UI, sharing, turn on auto answer and lock volume and mute
 * Hold down the up (+) volume key for approx 5 sec to display the IP address on the screen for 30 sec
 * 
 * Author: Tyler Osgood - tyosgood@cisco.com
 */

import xapi from 'xapi';

//configurable variables
const VOLUME = 50;  //max volume

const VRI_Addr = 't100070001@www.tcsvri.com';  //video address for VRI

const PIN = '1234';  //Unlock PIN



//do not configure the following
const panel = 'PIN';
const dialVRI_button = 'VRIbutton';
const hideOSD_button = 'hideOSDbutton';
const displayIP_button = 'displayIPbutton';
var counter = [];



function init() {
    //initial lock down
    hideOSD();

    xapi.Config.Conference.AutoAnswer.Mode
        .set('On')
        .catch((error) => { console.error('Config.Conference.AutoAnswer.Mode: ' + error);});
    
    xapi.Config.Video.Input.Connector[2].PresentationSelection
         .set('Manual')
         .catch((error) => { console.error('Config.Video.Input.Connector[2].PresentationSelection: ' + error);});

    xapi.Config.Video.Input.Connector[3].PresentationSelection
        .set('Manual')
        .catch((error) => { console.error('Config.Video.Input.Connector[3].PresentationSelection: ' + error);});

    createButtons();

    //lock volume and mute
      xapi.Status.Audio.Volume.on((volume) => {
        xapi.Command.Audio.Volume.Set({ Level: VOLUME });
        if (volume > VOLUME) countVol();
        
      });
      xapi.Event.Audio.MicrophonesMuteStatus.on(value => {
        if (value.Mute == "On"){ xapi.Command.Audio.Microphones.Unmute();
        
      }});

    xapi.Event.UserInterface.Message.TextInput.Clear
        .on(value => {
          if (value.FeedbackId == panel) hideOSD()
        })

    xapi.Event.UserInterface.Message.TextInput.Response.on(value => {
        if (value.FeedbackId == panel && value.Text == PIN) {
            console.log('Valid PIN Entered - Unhiding OSD');
            return;
          } else {
            console.log('Invalid PIN Entered - Hiding OSD');
            hideOSD();
          }
      
          
      });
      
    xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
        if(event.PanelId === displayIP_button){
            displayIP();
        }
        else if(event.PanelId === dialVRI_button){
          xapi.Command.Dial({number: VRI_Addr});
        }
        else if(event.PanelId === hideOSD_button){
            hideOSD();
        }
    });


};


//Hold down the up (+) volume key for approx 5 sec to display the IP address on the screen
function countVol() {
    let now = new Date();
    counter.push(now);
    
    if (counter.length >=50) {
        counter = counter.slice(-50);
        let diff = now - counter[0];
        
        if (diff <= 6000 && diff >= 4500) {
          showOSD();           
          askForPIN();
          counter.length=0;
        }
      }
}



//Display IP address on screen for 30 sec
async function displayIP() {
const IP_addr = await xapi.Status.Network[1].IPv4.Address.get()
  xapi.Command.UserInterface.Message.Prompt.Display(
    { Title:'IP Address', Text: IP_addr, Duration: 30});
}

function hideOSD(){
  xapi.Config.UserInterface.OSD.Mode
          .set('Unobstructed')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);});
}

function showOSD(){
  xapi.Config.UserInterface.OSD.Mode
          .set('Auto')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);});
}

function askForPIN() {
  xapi.Command.UserInterface.Message.TextInput.Display({
    FeedbackId: panel,
    InputType: 'PIN',
    Placeholder: 'Please Enter PIN',
    SubmitText: 'Submit',
    Text: 'Please Enter PIN',
    Title: 'Unlock PIN'
  });
}

function createButtons(){
  try{
   
     xapi.Command.UserInterface.Extensions.Panel.Save({PanelId: dialVRI_button}, `
        <Extensions>
           <Panel>
            <Origin>local</Origin>
            <Location>HomeScreen</Location>
            <Icon>Helpdesk</Icon>
            <Name>Dial VRI</Name>
          </Panel>
         </Extensions>
    `);

    xapi.Command.UserInterface.Extensions.Panel.Save({PanelId: displayIP_button}, `
        <Extensions>
           <Panel>
            <PanelId>`+ displayIP_button +`</PanelId>
            <Origin>local</Origin>
            <Location>HomeScreen</Location>
            <Icon>Info</Icon>
            <Name>Display IP Address</Name>
            <ActivityType>Custom</ActivityType>
          </Panel>
         </Extensions>
      `);
      
     xapi.Command.UserInterface.Extensions.Panel.Save({PanelId: hideOSD_button}, `
        <Extensions>
           <Panel>
            <PanelId>`+ hideOSD_button +`</PanelId>
            <Origin>local</Origin>
            <Location>HomeScreenAndCallControls</Location>
            <Icon>Home</Icon>
            <Name>Return to Kiosk Mode</Name>
            <ActivityType>Custom</ActivityType>
          </Panel> 
         </Extensions>
      `); 

      
    }


    
  catch (e) {console.error('Error:', e.message);}
}


init();