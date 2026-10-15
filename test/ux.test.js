import test from 'node:test';
import assert from 'node:assert/strict';
import {Settings, DisplayableNotificationListener} from '../src/jzt-ux.js';

test('Settings initializes controls and notifies listeners', () => {
  const controls = {
    'input[name=\'audio-enabled\']': {checked:false, addEventListener(type, fn) { this[type] = fn; }},
    'input[name=\'audio-volume\']': {value:0, addEventListener(type, fn) { this[type] = fn; }},
    'select[name=\'language\']': {value:'', addEventListener(type, fn) { this[type] = fn; }}
  };
  const element = {querySelector(selector) { return controls[selector]; }};
  const settings = new Settings(element); const seen = []; settings.addListener(value => seen.push(value));
  settings.initialize({audioActive:true, audioMute:false, audioVolume:0.7, language:'en'});
  assert.equal(controls["input[name='audio-volume']"].value, 7);
  controls["input[name='audio-enabled']"].click({target:{checked:true}});
  controls["input[name='audio-volume']"].change({target:{value:'3'}});
  assert.deepEqual(seen, [{audioMute:true}, {audioVolume:0.3}]);
});

test('DisplayableNotificationListener renders and clears warnings', () => {
  const button = {style:{display:'none'}}; const list = {innerHTML:'old'};
  const listener = new DisplayableNotificationListener({warningButton:button, warningListElement:list});
  listener.addNotification('warning', 'first\nsecond');
  assert.equal(button.style.display, 'block'); assert.match(list.innerHTML, /first<\/p><p>second/);
  listener.addNotification('info', 'ignored'); listener.clear();
  assert.equal(button.style.display, 'none'); assert.match(list.innerHTML, /first/);
});
