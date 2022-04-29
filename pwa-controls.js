import xapi from 'xapi';

// Customise the Button name
const BUTTON_NAME = 'PWA Controls';

// Set the default location for your Navigators
const LOCATION = 'InsideRoom';


// Create your URLs in which you would like to display
// Miniumn you need a unique Text and URL field
// Prameters set to true will cause the LED Sequence to be sent
// Including an iFrame will send the iFrame URL to the main URL as a 'url' parameter
// Default set to true will make the macro automatically assign that URL each time its initialized
const PWA_URLS = [
  {
    "Text" : 'Workspace iFrame',
    "URL" : 'https://www.example.com',
    "Parameters" : true,
    "iFrame" : 'https://iframe.example.com',
    "Default" : true
  },
  {
    "Text" : 'Google',
    "URL" : 'www.google.com',
    "Parameters" : false,
  },
  {
    "Text" : 'Test',
    "URL" : 'www.google.com',
    "Parameters" : false,
  }
];


//// Do not touch ///


const COLORS = ['Green', 'Yellow', 'Red', 'Off'];
const LED_SEQUENCE = [0,1,3,2,3,2,1,0];
const LED_STRING = +LED_SEQUENCE.join("");
let BUFFER = new Array(LED_SEQUENCE.length).fill(0);


// Generates the PWA URL based off the site settings
function createURL(site){

  console.log('Creating URL')

  let link = '';

  if (site.Parameters && site.iFrame) {
    link = `${site.URL}?led=${LED_STRING}&url=${site.iFrame}`;
  } else if (site.Parameters){
    link = `${site.URL}?led=${LED_STRING}`;
  } else {
    link = site.URL;
  }

  return link;

}

// Sets the PWA URL
function setPWAURL(url) {

  console.log('PWA URL set to: ' +url);

  xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.set(url);

}


// Used initially to identify the default URL and sets it
function setDefaultURL() {

  PWA_URLS.forEach(site => {
    if(site.Default){
      setPWAURL(createURL(site));
      console.log(`Default site: ${site.URL}`);
      return;
    }
  })

}

// Converts a 

ator to controller mode
// If no navigator is given, it will convert all connected Navigators to controller mode
async function disablePWA(navigator) {

  if (navigator == null){
    console.log('Disabling for all Navigators');
    alertUser('Disabling PWA on all Webex Navigators, this will take 20 seconds');
    const navigators = await listNavigators();

    navigators.forEach(device => {

      xapi.Command.Peripherals.TouchPanel.Configure(
      {
        ID: device.ID, 
        Location: LOCATION, 
        Mode: 'Controller'
      });

    });
  } else {
    console.log('Disabling PWA for: ' + navigator);
    alertUser('Disabling PWA, this will take 20 seconds');
    xapi.Command.Peripherals.TouchPanel.Configure(
      {
        ID: navigator, 
        Location: LOCATION, 
        Mode: 'Controller'
      });
  }
  
}


// Enables or disables a specific navigator for PWA or Controller
function setDeviceMode(navigator, on) {

  const mode = on ? 'PersistentWebApp' : 'Controller';

  console.log(`Setting ${navigator} to ${mode} mode`)

  const message = `Setting ${navigator} to ${mode} mode`;
  console.log(message);

  alertUser(`${message}, this will take 20 seconds`);

  xapi.Command.Peripherals.TouchPanel.Configure(
    {
      ID: navigator, 
      Location: LOCATION, 
      Mode: mode
    }
  );

}

// This function compares the LED blink sequence
function compare(){

  console.log(`LED: ${JSON.stringify(LED_SEQUENCE)} | Buffer: ${JSON.stringify(BUFFER)}`)
  if(JSON.stringify(LED_SEQUENCE)==JSON.stringify(BUFFER)){
    console.log("Match");
    disablePWA();
    BUFFER.fill(0);
  } else {
    
  }

}

// Adds a LED color event to the buffer
function addToBuffer(value) {
  BUFFER.shift();
  BUFFER.push(value);
  compare();
}

// Converts a int to a color
function convertColor(color){
  return COLORS.indexOf(color);
}

// Handles the LED color event
function ledMonitor(color) {  
  addToBuffer(convertColor(color));
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

  console.log('Current URL: ' +currentURL)

  const navigators = await listNavigators();

  // Update the Site select panel
  PWA_URLS.forEach( (site, i) => {

    console.log('Site URL: ' +site.URL);

    if(currentURL.indexOf('url=') == -1) {
      console.log('No url parameter')
      console.log(`Setting ${site.Text} to ${(currentURL.indexOf(site.URL) != -1) ? 'on' : 'off'}`)
      xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'pwa_site_'+i,
        Value: (currentURL.indexOf(site.URL) != -1) ? 'on' : 'off',
      });
    } else {
      console.log('Has URL Parameter')
      console.log(`iFrame: ${site.iFrame}`)
      console.log(`Setting ${site.Text} to ${(currentURL.indexOf('url='+site.iFrame) != -1) ? 'on' : 'off'}`)
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

  PWA_URLS.forEach((site, i)=> {

    if('pwa_site_'+i == event.WidgetId) {
      setPWAURL(createURL(site))
      return;
    }

  })

}

// Our main function which initializes everything
async function main(){

  setDefaultURL();

  createPanel();

  await syncUI();


   // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetEvent);

  // Monitor the LED change events
  xapi.Status.UserInterface.LedControl.Color.on(ledMonitor);

  // Monitor URL changes
  xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.on(syncUI);

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

// Run our main function and begin monitoring events
main();
