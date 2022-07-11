import xapi from 'xapi';
import {config} from './pwa-controls-config';

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
      Location: config.location, 
      Mode: mode
    }
  );

}




// Alerts user of a PWA/Controller change
function alertUser(message) {

  xapi.Command.UserInterface.Message.Alert.Display(
    {
      Duration: 20, 
      Title: config.buttonName,
      Text: message });

}

// Updates the UI with the current states
async function syncUI() {

  console.log('Syncing UI')

  const currentURL = await xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.get();

  const navigators = await listNavigators();

  // Update the Site select panel
  config.pwaUrls.forEach( (site, i) => {

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

  for ( let i=0; i < config.pwaUrls.length; i++ ) {
    if('pwa_site_'+i == event.WidgetId) {
      setPWAURL(config.pwaUrls[i].URL)
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

  config.pwaUrls.forEach( (site, i) => {

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
      <Name>${config.buttonName}</Name>
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

export {
    monitorMessage,
    peripheralsChange,
    widgetEvent,
    createPanel,
    syncUI
}
