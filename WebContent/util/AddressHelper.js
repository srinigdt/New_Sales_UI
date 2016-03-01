$.sap.declare("gdt.salesui.util.AddressHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.util.AddressHelper = (function($, core, _) {
	var _canonicalState = function(state) {
			var val;
			if (!state) return '';

			switch (state.trim().toLowerCase()) {
				case 'alabama':
				case 'al':
					val = 'AL';
					break;
				case 'alaska':
				case 'ak':
					val = 'AK';
					break;
				case 'arizona':
				case 'az':
					val = 'AZ';
					break;
				case 'arkansas':
				case 'ar':
					val = 'AR';
					break;
				case 'california':
				case 'ca':
					val = 'CA';
					break;
				case 'colorado':
				case 'co':
					val = 'CO';
					break;
				case 'connecticut':
				case 'ct':
					val = 'CT';
					break;
				case 'delaware':
				case 'de':
					val = 'DE';
					break;
				case 'florida':
				case 'fl':
					val = 'FL';
					break;
				case 'georgia':
				case 'ga':
					val = 'GA';
					break;
				case 'hawaii':
				case 'hi':
					val = 'HI';
					break;
				case 'idaho':
				case 'id':
					val = 'ID';
					break;
				case 'illinois':
				case 'il':
					val = 'IL';
					break;
				case 'indiana':
				case 'in':
					val = 'IN';
					break;
				case 'iowa':
				case 'ia':
					val = 'IA';
					break;
				case 'kansas':
				case 'ks':
					val = 'KS';
					break;
				case 'kentucky':
				case 'ky':
					val = 'KY';
					break;
				case 'louisiana':
				case 'la':
					val = 'LA';
					break;
				case 'maine':
				case 'me':
					val = 'ME';
					break;
				case 'maryland':
				case 'md':
					val = 'MD';
					break;
				case 'massachusetts':
				case 'ma':
					val = 'MA';
					break;
				case 'michigan':
				case 'mi':
					val = 'MI';
					break;
				case 'minnesota':
				case 'mn':
					val = 'MN';
					break;
				case 'mississippi':
				case 'ms':
					val = 'MS';
					break;
				case 'missouri':
				case 'mo':
					val = 'MO';
					break;
				case 'montana':
				case 'mt':
					val = 'MT';
					break;
				case 'nebraska':
				case 'ne':
					val = 'NE';
					break;
				case 'nevada':
				case 'nv':
					val = 'NV';
					break;
				case 'new hampshire':
				case 'nh':
					val = 'NH';
					break;
				case 'new jersey':
				case 'nj':
					val = 'NJ';
					break;
				case 'new mexico':
				case 'nm':
					val = 'NM';
					break;
				case 'new york':
				case 'ny':
					val = 'NY';
					break;
				case 'north carolina':
				case 'nc':
					val = 'NC';
					break;
				case 'north dakota':
				case 'nd':
					val = 'ND';
					break;
				case 'ohio':
				case 'oh':
					val = 'OH';
					break;
				case 'oklahoma':
				case 'ok':
					val = 'OK';
					break;
				case 'oregon':
				case 'or':
					val = 'OR';
					break;
				case 'pennsylvania':
				case 'pa':
					val = 'PA';
					break;
				case 'rhode island':
				case 'ri':
					val = 'RI';
					break;
				case 'south carolina':
				case 'sc':
					val = 'SC';
					break;
				case 'south dakota':
				case 'sd':
					val = 'SD';
					break;
				case 'tennessee':
				case 'tn':
					val = 'TN';
					break;
				case 'texas':
				case 'tx':
					val = 'TX';
					break;
				case 'utah':
				case 'ut':
					val = 'UT';
					break;
				case 'vermont':
				case 'vt':
					val = 'VT';
					break;
				case 'virginia':
				case 'va':
					val = 'VA';
					break;
				case 'washington':
				case 'wa':
					val = 'WA';
					break;
				case 'west virginia':
				case 'wv':
					val = 'WV';
					break;
				case 'wisconsin':
				case 'wi':
					val = 'WI';
					break;
				case 'wyoming':
				case 'wy':
					val = 'WY';
					break;
				default:
					val = '';
					break;
			}

			return val;
		},

		_canonicalStreet = function(street) {
			var val,
				tokens = [];
			if (!street) return '';

			val = '';

			tokens = street.split(/[ ,]+/).filter(Boolean);

			_.each(tokens, function(token) {
				val += ((val.length == 0) ? '' : ' ') + _canonicalStreetPart(token);
			});

			return val;

		},

		_canonicalStreetPart = function(part) {
			var val;

			if (!part) return '';

			val = '';

			switch (part.trim().replace(/\./g,'').toLowerCase()) {
				case 'alley':
				case 'allee':
				case 'ally':
				case 'aly' :
					val = 'aly';
					break;
				case 'anex':
				case 'annex':
				case 'annx':
				case 'anx' :
					val = 'anx';
					break;
				case 'arcade':
				case 'arc':
					val = 'arc';
					break;
				case 'avenue':
				case 'avenu':
				case 'avnue':
				case 'aven' :
				case 'ave' :
				case 'av' :
					val = 'ave';
					break;
				case 'bayoo':
				case 'bayou':
				case 'byu':
					val = 'byu';
					break;
				case 'beach':
				case 'bch':
					val = 'bch';
					break;
				case 'bend':
				case 'bnd':
					val = 'bnd';
					break;
				case 'bluff':
				case 'bluf':
				case 'blf':
					val = 'blf';
					break;
				case 'bluffs':
					val = 'blfs';
					break;
				case 'bottom':
				case 'bottm':
				case 'bot':
				case 'btm':
					val = 'btm';
					break;
				case 'boulevard':
				case 'blvd':
				case 'boul':
				case 'boulv':
					val = 'blvd';
					break;
				case 'branch':
				case 'brnch':
				case 'br' :
					val = 'br';
					break;
				case 'bridge':
				case 'brdge':
				case 'brg' :
					val = 'brg';
					break;
				case 'brook':
				case 'brk':
					val = 'brk';
					break;
				case 'brooks':
					val = 'brks';
					break;
				case 'bypass':
				case 'byp':
				case 'bypa':
				case 'bypas':
				case 'byps':
					val = 'byp';
					break;
				case 'camp':
				case 'cmp' :
				case 'cp' :
					val = 'cp';
					break;
				case 'canyon':
				case 'canyn' :
				case 'cnyn' :
				case 'cyn' :
					val = 'cyn';
					break;
				case 'cape':
				case 'cpe' :
					val = 'cpe';
					break;
				case 'causeway':
				case 'causewa' :
				case 'cswy' :
					val = 'cswy';
					break;
				case 'center':
				case 'centre' :
				case 'cent' :
				case 'cen' :
				case 'centr' :
				case 'cnter' :
				case 'cntr' :
				case 'ctr' :
					val = 'ctr';
					break;
				case 'centers' :
					val = 'ctrs';
					break;
				case 'circle':
				case 'circ':
				case 'circl':
				case 'crcl':
				case 'crcle':
				case 'circus':
				case 'cir' :
					val = 'cir';
					break;
				case 'circles' :
				case 'cirs' :
					val = 'cirs';
					break;
				case 'cliff':
				case 'clf' :
					val = 'clf';
					break;
				case 'club' :
				case 'clb' :
					val = 'clb';
					break;
				case 'common' :
					val = 'common';
					break;
				case 'commons' :
					val = 'commons'
					break;
				case 'corner' :
				case 'cor' :
					val = 'cor';
					break;
				case 'corners' :
				case 'cors' :
					val = 'cors';
					break;
				case 'course' :
				case 'crse' :
					val = 'crse';
					break;
				case 'court' :
				case 'ct' :
					val = 'ct';
					break;
				case 'courts' :
				case 'cts' :
					val = 'cts';
					break;
				case 'cove' :
				case 'cv' :
					val = 'cv';
					break;
				case 'coves' :
				case 'cvs' :
					val = 'cvs';
					break;
				case 'creek' :
				case 'crk' :
					val = 'crk';
					break;
				case 'crescent' :
				case 'crsent' :
				case 'crsnt' :
				case 'cres' :
					val = 'cres';
					break;
				case 'crest' :
				case 'crst' :
					val = 'crst';
					break;
				case 'crossing' :
				case 'crssng' :
				case 'xing' :
					val = 'xing';
					break;
				case 'crossroad' :
				case 'xrd' :
					val = 'xrd';
					break;
				case 'crossroads' :
				case 'xrds' :
					val = 'xrds';
					break;
				case 'curve' :
				case 'curv' :
					val = 'curv';
					break;
				case 'dale' :
				case 'dl' :
					val = 'dl';
					break;
				case 'dam' :
				case 'dm' :
					val = 'dm';
					break;
				case 'divide' :
				case 'div' :
				case 'dvd' :
				case 'dv' :
					val = 'dv';
					break;
				case 'drive' :
				case 'driv' :
				case 'drv' :
				case 'dr' :
					val = 'dr';
					break;
				case 'drives' :
				case 'drs' :
					val = 'drs';
					break;
				case 'estate' :
				case 'est' :
					val = 'est';
					break;
				case 'estates' :
				case 'ests' :
					val = 'ests';
					break;
				case 'expressway' :
				case 'exp' :
				case 'expr' :
				case 'express' :
				case 'expw' :
				case 'expy' :
					val = 'expy';
					break;
				case 'extension' :
				case 'extn' :
				case 'extnsn' :
				case 'ext' :
					val = 'ext';
					break;
				case 'extensions' :
				case 'exts' :
					val = 'exts';
					break;
				case 'fall' :
					val = 'fall';
					break;
				case 'falls' :
				case 'fls' :
					val = 'fls';
					break;
				case 'ferry' :
				case 'frry' :
				case 'fry' :
					val = 'fry';
					break;
				case 'field' :
				case 'fld' :
					val = 'fld';
					break;
				case 'fields' :
				case 'flds' :
					val = 'flds';
					break;
				case 'flat' :
				case 'flt' :
					val = 'flt';
					break;
				case 'flats' :
				case 'flts' :
					val = 'flts';
					break;
				case 'ford' :
				case 'frd' :
					val = 'frd';
					break;
				case 'fords' :
				case 'frds' :
					val = 'frds';
					break;
				case 'forest' :
				case 'forests' :
				case 'frst' :
					val = 'frst';
					break;
				case 'forge' :
				case 'forg' :
				case 'frg' :
					val = 'frg';
					break;
				case 'forges' :
				case 'frgs' :
					val = 'frgs';
					break;
				case 'fork' :
				case 'frk' :
					val = 'frk';
					break;
				case 'forks' :
				case 'frks' :
					val = 'frks';
					break;
				case 'fort' :
				case 'frt' :
					val = 'ft';
					break;
				case 'freeway' :
				case 'freewy' :
				case 'frway' :
				case 'frwy' :
				case 'fwy' :
					val = 'fwy';
					break;
				case 'garden' :
				case 'gardn' :
				case 'grden' :
				case 'grdn' :
				case 'gdn' :
					val = 'gdn';
					break;
				case 'gardens' :
				case 'grdns' :
				case 'gdns' :
					val = 'gdn';
					break;
				case 'gateway' :
				case 'gatewy' :
				case 'gatwy' :
				case 'gtway' :
				case 'gtwy' :
					val = 'gtwy';
					break;
				case 'glen' :
				case 'gln' :
					val = 'gln';
					break;
				case 'glens' :
				case 'glns' :
					val = 'glns';
					break;
				case 'green' :
				case 'grn' :
					val = 'grn';
					break;
				case 'greens' :
				case 'grns' :
					val = 'grns';
					break;
				case 'grove' :
				case 'grov' :
				case 'grv' :
					val = 'grv';
					break;
				case 'groves' :
				case 'grvs' :
					val = 'grvs';
					break;
				case 'harbor' :
				case 'harbr' :
				case 'hrbor' :
				case 'harb' :
				case 'hbr' :
					val = 'hbr';
					break;
				case 'harbors' :
				case 'harbrs' :
				case 'hrbors' :
				case 'harbs' :
				case 'hbrs' :
					val = 'hbrs';
					break;
				case 'haven' :
				case 'hvn' :
					val = 'hvn';
					break;
				case 'heights' :
				case 'ht' :
				case 'hts' :
					val = 'hts';
					break;
				case 'highway' :
				case 'highwy' :
				case 'hiway' :
				case 'hway' :
				case 'hiwy' :
				case 'hwy' :
					val = 'hwy';
					break;
				case 'hill' :
				case 'hl' :
					val = 'hl';
					break;
				case 'hills' :
				case 'hls' :
					val = 'hls';
					break;
				case 'hollow' :
				case 'hollows' :
				case 'hllw' :
				case 'holws' :
				case 'holw' :
					val = 'holw';
					break;
				case 'inlet' :
				case 'inlt' :
					val = 'inlt';
					break;
				case 'island' :
				case 'islnd' :
				case 'is' :
					val = 'is';
					break;
				case 'islands' :
				case 'islnds' :
				case 'iss' :
					val = 'iss';
					break;
				case 'isle' :
				case 'isles' :
					val = 'isle';
					break;
				case 'junction' :
				case 'jction' :
				case 'jctn' :
				case 'junctn' :
				case 'juncton' :
				case 'jct' :
					val = 'jct';
					break;
				case 'junctions' :
				case 'jctns' :
				case 'jcts' :
					val = 'jcts';
					break;
				case 'key' :
				case 'ky' :
					val = 'ky';
					break;
				case 'keys' :
				case 'kys' :
					val = 'kys';
					break;
				case 'knoll' :
				case 'knol' :
				case 'knl' :
					val = 'knl';
					break;
				case 'knolls' :
				case 'knls' :
					val = 'knls';
					break;
				case 'lake' :
				case 'lk' :
					val = 'lk';
					break;
				case 'lakes' :
				case 'lks' :
					val = 'lks';
					break;
				case 'landing' :
				case 'lndng' :
				case 'lndg' :
					val = 'lndg';
					break;
				case 'lane' :
				case 'ln' :
					val = 'ln';
					break;
				case 'light' :
				case 'lgt' :
					val = 'lgt';
					break;
				case 'lights' :
				case 'lgts' :
					val = 'lgts';
					break;
				case 'loaf' :
				case 'lf' :
					val = 'lf';
					break;
				case 'lock' :
				case 'lck' :
					val = 'lck';
					break;
				case 'locks' :
				case 'lcks' :
					val = 'lcks';
					break;
				case 'lodge' :
				case 'ldge' :
				case 'lodg' :
				case 'ldg' :
					val = 'ldg';
					break;
				case 'loops' :
				case 'loop' :
					val = 'loop';
					break;
				case 'manor' :
				case 'mnr' :
					val = 'mnr';
				case 'manors' :
				case 'mnrs' :
					val = 'mnrs';
					break;
				case 'meadow' :
				case 'mdw' :
					val = 'mdw';
					break;
				case 'meadows' :
				case 'mdws' :
					val = 'mdws';
					break;
				case 'mill' :
				case 'ml' :
					val = 'ml';
					break;
				case 'mills' :
				case 'mls' :
					val = 'mls';
					break;
				case 'mission' :
				case 'missn' :
				case 'mssn' :
				case 'msn' :
					val = 'msn';
					break;
				case 'motorway' :
				case 'mtwy' :
					val = 'mtwy';
					break;
				case 'mount' :
				case 'mnt' :
				case 'mt' :
					val = 'mt';
					break;
				case 'mountain' :
				case 'mntn' :
				case 'mountin' :
				case 'mntain' :
				case 'mtin' :
				case 'mtn' :
					val = 'mtn';
					break;
				case 'mountains' :
				case 'mtns' :
					val = 'mtns';
					break;
				case 'neck' :
				case 'nck' :
					val = 'nck';
					break;
				case 'orchard' :
				case 'orchrd' :
				case 'orch' :
					val = 'orch';
					break;
				case 'oval' :
				case 'ovl' :
					val = 'oval';
					break;
				case 'overpass' :
				case 'opas' :
					val = 'opas';
				case 'parks' :
				case 'park' :
				case 'prk' :
					val = 'park';
					break;
				case 'parkways' :
				case 'parkway' :
				case 'parkwy' :
				case 'pkway' :
				case 'pky' :
				case 'pkwys' :
				case 'pkwy' :
					val = 'pkwy';
					break;
				case 'passage' :
				case 'psge' :
					val = 'psge';
					break;
				case 'path' :
				case 'paths' :
					val = 'path';
					break;
				case 'pike' :
				case 'pikes' :
					val = 'pike';
					break;
				case 'pine' :
				case 'pne' :
					val = 'pne';
					break;
				case 'pines' :
				case 'pnes' :
					val = 'pnes';
					break;
				case 'place':
				case 'pl' :
					val = 'pl';
					break;
				case 'plain':
				case 'pln' :
					val = 'pln';
					break;
				case 'plains':
				case 'plns' :
					val = 'plns';
					break;
				case 'plaza':
				case 'plza' :
				case 'plz' :
					val = 'plz';
					break;
				case 'point':
				case 'pt' :
					val = 'pt';
					break;
				case 'points':
				case 'pts' :
					val = 'pts';
					break;
				case 'port':
				case 'prt' :
					val = 'prt';
					break;
				case 'ports':
				case 'prts' :
					val = 'prts';
					break;
				case 'prairie':
				case 'prr':
				case 'pr' :
					val = 'pr';
					break;
				case 'radial':
				case 'radiel':
				case 'rad' :
				case 'radl' :
					val = 'radl';
					break;
				case 'ranch':
				case 'ranches':
				case 'rnch' :
				case 'rnchs' :
					val = 'rnch';
					break;
				case 'rapid':
				case 'rpd' :
					val = 'rpd';
					break;
				case 'rapids':
				case 'rpds' :
					val = 'rpds';
					break;
				case 'rest':
				case 'rst' :
					val = 'rst';
					break;
				case 'ridge':
				case 'rdge' :
				case 'rdg' :
					val = 'rdg';
					break;
				case 'ridges':
				case 'rdges' :
				case 'rdgs' :
					val = 'rdgs';
					break;
				case 'river':
				case 'rivr' :
				case 'rvr' :
				case 'riv' :
					val = 'riv';
					break;
				case 'road':
				case 'rd' :
					val = 'rd';
					break;
				case 'roads':
				case 'rds' :
					val = 'rds';
					break;
				case 'route':
				case 'rte' :
					val = 'rte';
					break;
				case 'shoal':
				case 'shl' :
					val = 'shl';
					break;
				case 'shoals':
				case 'shls' :
					val = 'shls';
					break;
				case 'shore':
				case 'shoar':
				case 'shr' :
					val = 'shr';
					break;
				case 'shores':
				case 'shoars':
				case 'shrs' :
					val = 'shrs';
					break;
				case 'skyway':
				case 'skwy' :
					val = 'skwy';
					break;
				case 'spring':
				case 'spng' :
				case 'sprng' :
				case 'spg' :
					val = 'spg';
					break;
				case 'springs':
				case 'spngs' :
				case 'sprngs' :
				case 'spgs' :
					val = 'spgs';
					break;
				case 'spurs':
				case 'spur' :
					val = 'spur';
					break;
				case 'square':
				case 'sqre' :
				case 'sqr' :
				case 'squ' :
				case 'sq' :
					val = 'sq';
					break;
				case 'squares':
				case 'sqrs' :
				case 'sqs' :
					val = 'sqs';
					break;
				case 'station':
				case 'statn' :
				case 'stn' :
				case 'sta' :
					val = 'sta';
					break;
				case 'stravenue':
				case 'stra' :
				case 'strav' :
				case 'strvn' :
				case 'strvnue' :
				case 'stravn' :
				case 'straven' :
				case 'stra' :
					val = 'stra';
					break;
				case 'stream':
				case 'streme':
				case 'strm':
					val = 'strm';
					break;
				case 'street':
				case 'strt':
				case 'str':
				case 'st' :
					val = 'st';
					break;
				case 'streets':
				case 'sts' :
					val = 'sts';
					break;
				case 'summit':
				case 'sumitt':
				case 'sumit':
				case 'smt' :
					val = 'smt';
					break;
				case 'terrace':
				case 'terr':
				case 'ter' :
					val = 'ter';
					break;
				case 'throughway':
				case 'trwy' :
					val = 'trwy';
					break;
				case 'trace':
				case 'traces':
				case 'trce' :
					val = 'trce';
					break;
				case 'track':
				case 'tracks':
				case 'trak':
				case 'trk' :
				case 'trks' :
					val = 'trak';
					break;
				case 'trafficway':
				case 'trfy' :
					val = 'trfy';
					break;
				case 'trail':
				case 'trails':
				case 'trl':
				case 'trls' :
					val = 'trl';
					break;
				case 'trailer':
				case 'trlr':
				case 'trlrs' :
					val = 'trlr';
					break;
				case 'tunel':
				case 'tunnl':
				case 'tunls':
				case 'tunnel' :
				case 'tunnles' :
				case 'tunl':
					val = 'trak';
					break;
				case 'turnpike':
				case 'trnpk':
				case 'turnpk' :
				case 'tpke':
					val = 'tpke';
					break;
				case 'underpass':
				case 'upas' :
					val = 'upas';
					break;
				case 'union':
				case 'un' :
					val = 'un';
					break;
				case 'unions':
				case 'uns' :
					val = 'uns';
					break;
				case 'valley':
				case 'vally':
				case 'vlly' :
				case 'vly':
					val = 'vly';
					break;
				case 'valleys':
				case 'vallys':
				case 'vllys' :
				case 'vlys':
					val = 'vlys';
					break;
				case 'viaduct':
				case 'viadct':
				case 'vdct' :
				case 'via':
					val = 'via';
					break;
				case 'view':
				case 'vw':
					val = 'vw';
					break;
				case 'village':
				case 'villiage':
				case 'villag' :
				case 'vill' :
				case 'villg' :
				case 'vlg':
					val = 'vlg';
					break;
				case 'villages' :
				case 'vlgs':
					val = 'vlgs';
					break;
				case 'ville' :
				case 'vl':
					val = 'vl';
					break;
				case 'vista' :
				case 'vist' :
				case 'vst' :
				case 'vsta' :
				case 'vis':
					val = 'vis';
					break;
				case 'walks':
				case 'walk':
					val = 'walks';
					break;
				case 'way':
				case 'wy':
					val = 'wy';
					break;
				case 'well':
				case 'wl':
					val = 'wl';
					break;
				case 'wells':
				case 'wls':
					val = 'wls';
					break;
				default:
					val = part;
					break;
			}

			return val;
		},

		parseAddress = function(addressString) {
			var addressTokens = ($.type(addressString) === "string") ? addressString.split(',') : [],
				address = {Street: '', City: '', State: '', Zip: ''};

			for (var i=addressTokens.length - 1; i >= 0; i--) {
				if (!address.Zip && ((parseInt(addressTokens[i]).toString()  == addressTokens[i] && addressTokens[i].length == 5) ||
					(addressTokens[i].length == 10 && addressTokens[i][5] == '-'))) {
					address.Zip = addressTokens[i];
				} else {
					if (!address.State && !!_canonicalState(addressTokens[i])) {
						address.State = addressTokens[i];
					} else {
						if (!address.City) {
							address.City = addressTokens[i];
						} else {
							address.Street += ((address.Street.length != 0) ? ', ' : '') + addressTokens[i];
						}
					}
				}
			}

			return address;
		},

		toString = function(address) {
			var addressString = '';

			if ($.type(address) === "string") return address;

            if (!!address.PartnerName) addressString += address.PartnerName;
            if (!!address.Street) addressString += ((addressString.length > 0) ? ', ' : '') + address.Street;
			if (!!address.City) addressString += ((addressString.length > 0) ? ', ' : '') + address.City;
			if (!!address.State) addressString += ((addressString.length > 0) ? ', ' : '') + address.State;
			if (!!address.Zip) addressString += ((addressString.length > 0) ? ', ' : '') + address.Zip;

			return addressString;
		},

		convertToCanonicalAddress = function(address) {
			var canonicalAddress = {},
				returnAsString = false;

			if ($.type(address) === "string") {
				address = parseAddress(address);
				returnAsString = true;
			}

			canonicalAddress.Street =  (!!address.Street) ? _canonicalStreet(address.Street) : '';
			canonicalAddress.City =  (!!address.City) ? address.City : '';
			canonicalAddress.Zip =  (!!address.Zip) ? address.Zip : '';
			canonicalAddress.State = (!!address.State) ? _canonicalState(address.State) : '';

			if (returnAsString) {
				canonicalAddress = toString(canonicalAddress);
			}

			return canonicalAddress;
		},
		equals = function(address1, address2) {
			var a1, a2;

			if ($.type(address1) !== "string") {
				a1 = toString(address1);
			} else {
				a1 = address1;
			}

			if ($.type(address2) !== "string") {
				a2 = toString(address2);
			} else {
				a2 = address2;
			}

			a1 = convertToCanonicalAddress(a1.trim().replace(/[\.-]+/g,'').toLowerCase());
			a2 = convertToCanonicalAddress(a2.trim().replace(/[\.-]+/g,'').toLowerCase());

			return a1 == a2;

		},
		find = function(addressToFind, addressSet) {
            return _.find(addressSet, function(address) {
                return equals(address, addressToFind);
            });
		};
    	
    	return {
			parseAddress : parseAddress,
			find : find,
			toString : toString,
			convertToCanonicalAddress: convertToCanonicalAddress,
			equals : equals,
    	};
    })($,sap.ui.getCore(), _);