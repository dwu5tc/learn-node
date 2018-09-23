import '../sass/style.scss';

// $ querySelector, $$ querySelectorAll
import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

// autocomplete( document.querySelector('#address'), document.querySelector('#lat'), document.querySelector('#lng'));
autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );

makeMap( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart); // blingjs allows listening on multiple (a node list) instead of having to loop through all


