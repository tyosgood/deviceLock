/**
 * Configure system to hide UI, sharing, turn on auto answer and lock volume and mute
 * Hold down the up (+) volume key for approx 5 sec to display the IP address on the screen for 30 sec
 * 
 * Author: Tyler Osgood - tyosgood@cisco.com
 * Updated 5-28-26 to allow public to adjust voulme
 */

import xapi from 'xapi';

//configurable variables
var baseline_volume = 50;  //max volume
const VRI_Addr = 't100070001@www.tcsvri.com';  //video address for VRI
const PIN = '1234';  //Unlock PIN
const volume_locked = false;   //lock the volume so it cannot be changed by the public
const mute_locked = false;     //lock mute so it cannot be changed by the public - even if unlocked mute resets after call
const volume_reset= true;      //reset the volume to the baseline level after each call

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
        if (volume > baseline_volume){
          countVol();          
        }
        //need to do this because if volume is above 90 it breaks the ability to hold down vol up button to show pin pad
        if (volume > 90){  
          xapi.Command.Audio.Volume
              .Set({ Level: 90 })
              .catch((error) => { console.error('Command.Audio.Volume.Set: ' + error);});
        }
        if (volume_locked) {
          xapi.Command.Audio.Volume
              .Set({ Level: baseline_volume })
              .catch((error) => { console.error('Command.Audio.Volume.Set: ' + error);});
        }
       });
      
      xapi.Event.Audio.MicrophonesMuteStatus.on(value => {
        if (value.Mute == "On" && mute_locked){ xapi.Command.Audio.Microphones.Unmute()
            .catch((error) => { console.error('Command.Audio.Microphones.Unmute: ' + error);});
        
      }});

    xapi.Event.CallDisconnect.on(value =>{
        if (volume_reset) {
          xapi.Command.Audio.Volume
              .Set({ Level: baseline_volume })
              .catch((error) => { console.error('Command.Audio.Volume.Set: ' + error);});
        }
      });

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
        xapi.Command.Audio.Volume
              .Set({ Level: baseline_volume })
              .catch((error) => { console.error('Command.Audio.Volume.Set: ' + error);});
      }
}



//Display IP address on screen for 30 sec
async function displayIP() {
const IP_addr = await xapi.Status.Network[1].IPv4.Address.get()
  xapi.Command.UserInterface.Message.Prompt.Display(
    { Title:'IP Address', Text: IP_addr, Duration: 30});
}

function hideOSD(){
  //turn off background darkening to show wallpaper at full brightness
  xapi.Config.UserInterface.CustomWallpaperOverlay
    .set('Off')
    .catch((error) => { console.error('Config.UserInterface.CustomWallpaperOverlay:' + error);});
  //hide OSD
  xapi.Config.UserInterface.OSD.Mode
          .set('Unobstructed')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);
            return;
          });
  
  //unmute
  xapi.Command.Audio.Microphones.Unmute()

  xapi.Command.Audio.Volume
              .Set({ Level: baseline_volume })
              .catch((error) => { console.error('Command.Audio.Volume.Set: ' + error);});
  
   
}

function showOSD(){
  //darken background so user can see icon text
  xapi.Config.UserInterface.CustomWallpaperOverlay
    .set('On')
    .catch((error) => { console.error('Config.UserInterface.CustomWallpaperOverlay:' + error);});
  //show the OSD
  xapi.Config.UserInterface.OSD.Mode
          .set('Auto')
          .catch((error) => { console.error('Config.UserInterface.OSD.Mode:' + error);
            return;
          });
  //xapi.Command.Audio.Volume.Set({ Level: baseline_volume });
  
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
