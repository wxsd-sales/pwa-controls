/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 07/27/22
 * 
 * This Webex Device Persistent Web App Control Macro allows you to toggle
 * between Controller and PWA mode on your paired Webex Room Navigators and 
 * change between different PWA URLs and from a UI Panel on either your main
 * Touch enabled interface or another Navigator/Touch 10 in controller mode.
 * When no other controller is available to access the UI  and toggle from 
 * PWA to Controller mode. The Macro listens for the keyword "ExitPWA" which
 * can be sent to it via Cloud xAPI from the Web App which is open on the
 * Navigator.
 * eg. https://www.example.com/?device=12345&token12345
 * 
 ********************************************************/

import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

// Customise the Button name
const BUTTON_NAME = 'PWA Controls';

// Set the default location for your Navigators
const LOCATION = 'InsideRoom';


const PWA_URLS = [
  {
    "Text" : 'Example',
    "URL" : 'https://example.com/'
  },
  {
    "Text" : 'Presence on device',
    "URL" : 'https://wxsd-sales.github.io/presence-on-device/'
  },
  {
    "Text" : 'Google',
    "URL" : 'https://www.google.com'
  }
];

/*********************************************************
 * Do not change below
**********************************************************/


// Our main function which initializes everything
async function main(){

  // Create our UI
  createPanel();

  // Sync the UI states
  await syncUI();

   // Listen for Widget and PWA URL Change events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetEvent);
  xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.on(syncUI);
  xapi.Event.Message.Send.on(monitorMessage);
  xapi.Status.Peripherals.ConnectedDevice.on(peripheralsChange);

}

// Run our main function and begin monitoring events
main();


/*********************************************************
 * Functions for Macros operation
**********************************************************/


// Sets the PWA URL
function setPWAURL(url) {
  console.log('PWA URL set to: ' +url);
  xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.set(url);
}

// This function is called when a xAPI Send Message is called
// it will exit kiosk mode when it heards the keyword ExistKiosk
function monitorMessage(event) {

  if(event.Text == 'ExitPWA'){
    console.log('Switching all PWA Navigators back to controller mode');
    disablePWA();
  }

}

// This function is called when a xAPI Send Message is called
// it will exit kiosk mode when it heards the keyword ExistKiosk
function peripheralsChange(event) {

  console.log('Peripherals changed, updating UI')

  createPanel();

  syncUI();

}

// Converts a Navigator to controller mode
// If no navigator is given, it will convert all connected Navigators to controller mode
async function disablePWA() {

  const navigators = await listNavigators();

  navigators.forEach(device => {

    if(device.Type == "PersistentWebApp") {
      setDeviceMode(device.ID, false);
    }

  });

}

// Enables or disables a specific navigator for PWA or Controller
function setDeviceMode(navigator, on) {

  const mode = on ? 'PersistentWebApp' : 'Controller';
  const message = `Setting ${navigator} to ${mode} mode`;
  alertUser(`${message}, this will take 20 seconds`);

  xapi.Command.Peripherals.TouchPanel.Configure(
    {
      ID: navigator, 
      Location: LOCATION, 
      Mode: mode
    }
  );

}




// Alerts user of a PWA/Controller change
function alertUser(message) {

  xapi.Command.UserInterface.Message.Alert.Display(
    {
      Duration: 20, 
      Title: BUTTON_NAME,
      Text: message });

}

// Updates the UI with the current states
async function syncUI() {

  console.log('Syncing UI')

  const currentURL = await xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.get();

  const navigators = await listNavigators();

  // Update the Site select panel
  PWA_URLS.forEach( (site, i) => {

    if(currentURL.indexOf('url=') == -1) {
      xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'pwa_site_'+i,
        Value: (currentURL.indexOf(site.URL) != -1) ? 'on' : 'off',
      });
    } else {
      xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'pwa_site_'+i,
        Value: (currentURL.indexOf('url='+site.iFrame) != -1) ? 'on' : 'off',
      })
    }
  })


  // Update the navigator select list panel
  navigators.forEach( navigator => {
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: navigator.ID,
      Value: (navigator.Type == 'PersistentWebApp') ? 'on' : 'off',
    });
  })

}

// Handles user input events for widgets
async function widgetEvent(event){

  const navigators = await listNavigators();

  navigators.forEach(navigator => {
    if(navigator.ID == event.WidgetId){
      setDeviceMode(navigator.ID, event.Value === 'on');
      return;
    }
  })

  for ( let i=0; i < PWA_URLS.length; i++ ) {
    if('pwa_site_'+i == event.WidgetId) {
      setPWAURL(PWA_URLS[i].URL)
      return;
    }
  }

}




// This function will return a list of all Navigators attached to the system
async function listNavigators() {
  const devices = await xapi.Status.Peripherals.ConnectedDevice.get();

  let result = [];

  devices.forEach(device => {
    if ( device.Name == 'Cisco Webex Room Navigator') {

      result.push(device)

    }
  });

  return result;
}


/*********************************************************
 * UI Panel Section
**********************************************************/


// Here we create the Button and Panel for the UI
async function createPanel() {

  let sites = '';

  PWA_URLS.forEach( (site, i) => {

    const row = `
      <Row>
        <Name>${site.Text}</Name>
        <Options>size=1</Options>
        <Widget>
          <WidgetId>pwa_site_${i}</WidgetId>
          <Type>ToggleButton</Type>
          <Options>size=1</Options>
        </Widget>
      </Row>`;

    sites = sites.concat(row);

  })


  let devices = '';

  const navigators = await listNavigators();

  navigators.forEach( device => {

    const row = `
      <Row>
        <Name>${device.ID}</Name>
        <Options>size=4</Options>
        <Widget>
          <WidgetId>${device.ID}</WidgetId>
          <Type>ToggleButton</Type>
          <Options>size=1</Options>
        </Widget>
      </Row>`;

    
    devices = devices.concat(row);

  });

  const panel = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <Order>1</Order>
      <Type>Statusbar</Type>
      <Icon>Sliders</Icon>
      <Color>#CF7900</Color>
      <Name>${BUTTON_NAME}</Name>
      <ActivityType>Custom</ActivityType>
      <Page>
        <Name>Site Select</Name>
        ${sites}
        <Options/>
      </Page>
      <Page>
        <Name>Navigator Select</Name>
        <Row>
          <Name>Navigators mac</Name>
          <Widget>
            <WidgetId>pwa_text</WidgetId>
            <Name>PWA ENABLE</Name>
            <Type>Text</Type>
            <Options>size=2;fontSize=normal;align=right</Options>
          </Widget>
        </Row>
        ${devices}
        <Options/>
      </Page>
    </Panel>
  </Extensions>`;


  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'pwa_enable' }, 
    panel
  )
  
}

