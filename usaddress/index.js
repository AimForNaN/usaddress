const crfsuite = require('crfsuite');
const fs       = require('fs');
const path     = require('path');

const LABELS = [
    'AddressNumberPrefix',
    'AddressNumber',
    'AddressNumberSuffix',
    'StreetNamePreModifier',
    'StreetNamePreDirectional',
    'StreetNamePreType',
    'StreetName',
    'StreetNamePostType',
    'StreetNamePostDirectional',
    'SubaddressType',
    'SubaddressIdentifier',
    'BuildingName',
    'OccupancyType',
    'OccupancyIdentifier',
    'CornerOf',
    'LandmarkName',
    'PlaceName',
    'StateName',
    'ZipCode',
    'USPSBoxType',
    'USPSBoxID',
    'USPSBoxGroupType',
    'USPSBoxGroupID',
    'IntersectionSeparator',
    'Recipient',
    'NotAddress',
];

const PARENT_LABEL = 'AddressString';
const GROUP_LABEL  = 'AddressCollection';

const DIRECTIONS = new Set([
	'n', 's', 'e', 'w',
    'ne', 'nw', 'se', 'sw',
    'north', 'south', 'east', 'west',
    'northeast', 'northwest', 'southeast', 'southwest'
]);

const STREET_NAMES = new Set([
    'allee', 'alley', 'ally', 'aly', 'anex', 'annex', 'annx', 'anx',
    'arc', 'arcade', 'av', 'ave', 'aven', 'avenu', 'avenue', 'avn', 'avnue',
    'bayoo', 'bayou', 'bch', 'beach', 'bend', 'bg', 'bgs', 'bl', 'blf',
    'blfs', 'bluf', 'bluff', 'bluffs', 'blvd', 'bnd', 'bot', 'bottm',
    'bottom', 'boul', 'boulevard', 'boulv', 'br', 'branch', 'brdge', 'brg',
    'bridge', 'brk', 'brks', 'brnch', 'brook', 'brooks', 'btm', 'burg',
    'burgs', 'byp', 'bypa', 'bypas', 'bypass', 'byps', 'byu', 'camp', 'canyn',
    'canyon', 'cape', 'causeway', 'causwa', 'causway', 'cen', 'cent',
    'center', 'centers', 'centr', 'centre', 'ci', 'cir', 'circ', 'circl',
    'circle', 'circles', 'cirs', 'ck', 'clb', 'clf', 'clfs', 'cliff',
    'cliffs', 'club', 'cmn', 'cmns', 'cmp', 'cnter', 'cntr', 'cnyn', 'common',
    'commons', 'cor', 'corner', 'corners', 'cors', 'course', 'court',
    'courts', 'cove', 'coves', 'cp', 'cpe', 'cr', 'crcl', 'crcle', 'crecent',
    'creek', 'cres', 'crescent', 'cresent', 'crest', 'crk', 'crossing',
    'crossroad', 'crossroads', 'crscnt', 'crse', 'crsent', 'crsnt', 'crssing',
    'crssng', 'crst', 'crt', 'cswy', 'ct', 'ctr', 'ctrs', 'cts', 'curv',
    'curve', 'cv', 'cvs', 'cyn', 'dale', 'dam', 'div', 'divide', 'dl', 'dm',
    'dr', 'driv', 'drive', 'drives', 'drs', 'drv', 'dv', 'dvd', 'est',
    'estate', 'estates', 'ests', 'ex', 'exp', 'expr', 'express', 'expressway',
    'expw', 'expy', 'ext', 'extension', 'extensions', 'extn', 'extnsn',
    'exts', 'fall', 'falls', 'ferry', 'field', 'fields', 'flat', 'flats',
    'fld', 'flds', 'fls', 'flt', 'flts', 'ford', 'fords', 'forest', 'forests',
    'forg', 'forge', 'forges', 'fork', 'forks', 'fort', 'frd', 'frds',
    'freeway', 'freewy', 'frg', 'frgs', 'frk', 'frks', 'frry', 'frst', 'frt',
    'frway', 'frwy', 'fry', 'ft', 'fwy', 'garden', 'gardens', 'gardn',
    'gateway', 'gatewy', 'gatway', 'gdn', 'gdns', 'glen', 'glens', 'gln',
    'glns', 'grden', 'grdn', 'grdns', 'green', 'greens', 'grn', 'grns',
    'grov', 'grove', 'groves', 'grv', 'grvs', 'gtway', 'gtwy', 'harb',
    'harbor', 'harbors', 'harbr', 'haven', 'havn', 'hbr', 'hbrs', 'height',
    'heights', 'hgts', 'highway', 'highwy', 'hill', 'hills', 'hiway', 'hiwy',
    'hl', 'hllw', 'hls', 'hollow', 'hollows', 'holw', 'holws', 'hrbor', 'ht',
    'hts', 'hvn', 'hway', 'hwy', 'inlet', 'inlt', 'is', 'island', 'islands',
    'isle', 'isles', 'islnd', 'islnds', 'iss', 'jct', 'jction', 'jctn',
    'jctns', 'jcts', 'junction', 'junctions', 'junctn', 'juncton', 'key',
    'keys', 'knl', 'knls', 'knol', 'knoll', 'knolls', 'ky', 'kys', 'la',
    'lake', 'lakes', 'land', 'landing', 'lane', 'lanes', 'lck', 'lcks', 'ldg',
    'ldge', 'lf', 'lgt', 'lgts', 'light', 'lights', 'lk', 'lks', 'ln', 'lndg',
    'lndng', 'loaf', 'lock', 'locks', 'lodg', 'lodge', 'loop', 'loops', 'lp',
    'mall', 'manor', 'manors', 'mdw', 'mdws', 'meadow', 'meadows', 'medows',
    'mews', 'mi', 'mile', 'mill', 'mills', 'mission', 'missn', 'ml', 'mls',
    'mn', 'mnr', 'mnrs', 'mnt', 'mntain', 'mntn', 'mntns', 'motorway',
    'mount', 'mountain', 'mountains', 'mountin', 'msn', 'mssn', 'mt', 'mtin',
    'mtn', 'mtns', 'mtwy', 'nck', 'neck', 'opas', 'orch', 'orchard', 'orchrd',
    'oval', 'overlook', 'overpass', 'ovl', 'ovlk', 'park', 'parks', 'parkway',
    'parkways', 'parkwy', 'pass', 'passage', 'path', 'paths', 'pike', 'pikes',
    'pine', 'pines', 'pk', 'pkway', 'pkwy', 'pkwys', 'pky', 'pl', 'place',
    'plain', 'plaines', 'plains', 'plaza', 'pln', 'plns', 'plz', 'plza',
    'pne', 'pnes', 'point', 'points', 'port', 'ports', 'pr', 'prairie',
    'prarie', 'prk', 'prr', 'prt', 'prts', 'psge', 'pt', 'pts', 'pw', 'pwy',
    'rad', 'radial', 'radiel', 'radl', 'ramp', 'ranch', 'ranches', 'rapid',
    'rapids', 'rd', 'rdg', 'rdge', 'rdgs', 'rds', 'rest', 'ri', 'ridge',
    'ridges', 'rise', 'riv', 'river', 'rivr', 'rn', 'rnch', 'rnchs', 'road',
    'roads', 'route', 'row', 'rpd', 'rpds', 'rst', 'rte', 'rue', 'run', 'rvr',
    'shl', 'shls', 'shoal', 'shoals', 'shoar', 'shoars', 'shore', 'shores',
    'shr', 'shrs', 'skwy', 'skyway', 'smt', 'spg', 'spgs', 'spng', 'spngs',
    'spring', 'springs', 'sprng', 'sprngs', 'spur', 'spurs', 'sq', 'sqr',
    'sqre', 'sqrs', 'sqs', 'squ', 'square', 'squares', 'st', 'sta', 'station',
    'statn', 'stn', 'str', 'stra', 'strav', 'strave', 'straven', 'stravenue',
    'stravn', 'stream', 'street', 'streets', 'streme', 'strm', 'strt',
    'strvn', 'strvnue', 'sts', 'sumit', 'sumitt', 'summit', 'te', 'ter',
    'terr', 'terrace', 'throughway', 'tl', 'tpk', 'tpke', 'tr', 'trace',
    'traces', 'track', 'tracks', 'trafficway', 'trail', 'trailer', 'trails',
    'trak', 'trce', 'trfy', 'trk', 'trks', 'trl', 'trlr', 'trlrs', 'trls',
    'trnpk', 'trpk', 'trwy', 'tunel', 'tunl', 'tunls', 'tunnel', 'tunnels',
    'tunnl', 'turn', 'turnpike', 'turnpk', 'un', 'underpass', 'union',
    'unions', 'uns', 'upas', 'valley', 'valleys', 'vally', 'vdct', 'via',
    'viadct', 'viaduct', 'view', 'views', 'vill', 'villag', 'village',
    'villages', 'ville', 'villg', 'villiage', 'vis', 'vist', 'vista', 'vl',
    'vlg', 'vlgs', 'vlly', 'vly', 'vlys', 'vst', 'vsta', 'vw', 'vws', 'walk',
    'walks', 'wall', 'way', 'ways', 'well', 'wells', 'wl', 'wls', 'wy', 'xc',
    'xg', 'xing', 'xrd', 'xrds'
])

module.exports = class usaddress {
	constructor(model) {;
		this.TAGGER = crfsuite.Tagger();
		this.open(model || __dirname + '/' + 'usaddr.crfsuite');
	}

	construct (items) {
		var ret = [];
		items = items.map((item) => {
			var children = []
			,	entries  = item.entries()
			;
			this.pull(entries, '', children);
			ret.push(children);
		});
		return ret;
	}

	digits (token) {
		if (Math.max(1, parseInt(token))) {
			return 'all_digits';
		}
		else if (this.intersecting(Array.from(String(token)), Array.from(String('0123456789'))).length) {
			return 'some_digits';
		}
		else {
			return 'no_digits';
		}
	}

	intersecting (a, b) {
		return [...a].reduce((prev, curr) => {
			if (b.includes && b.includes(curr)) {
				prev.push(curr);
			}
			else if (b.has && b.has(curr)) {
				prev.push(curr);
			}
			return prev;
		}, []);
	}

	open (model) {
		if (fs.existsSync(model)) {
			this.TAGGER.open(model);
		}
		else {
			console.warn('You must train the model (parserator train --trainfile FILES) ' +
				`to create the ${model} file before you can use the parse ` +
				'and tag methods');
		}
	}

	parse (address_string) {
		var tokens = this.tokenize(address_string);
		if (!tokens) {
			return new Set();
		}
		var features = this.tokens2features(tokens);
		// Convert key-value pairs to string concatenations!
		features = this.construct(features);
		var tags = this.TAGGER.tag(features);
		return Array.from(tokens).map((token, idx) => {
			var tag = tags[idx];
			return [tag, token];
		});
	}

	pull (items, prefix, parent) {
		for (let [key, value] of items) {
			if (value instanceof Map) {
				this.pull(value.entries(), key + ':', parent);
			}
			else {
				if (typeof value == 'boolean') {
					// How we handle the boolean values can make or break things!
					if (value) parent.push(prefix + key);
				}
				else {
					parent.push(prefix + key + (value ? ':' + value : ''));
				}
			}
		}
	}

	tag (address_string, tag_mapping) {
		var tagged_address  = new Map()
		,	last_label      = null
		,	is_intersection = null
		,	og_labels       = new Set()
		,	address_type    = 'Ambiguous'
		,	parsed          = this.parse(address_string)
		;
		for (let [token, label] of parsed) {
			if (label == 'IntersectionSeparator') {
				is_intersection = true;
			}
			if (String(label).includes('StreetName') && is_intersection) {
				label = 'Second' + label;
			}

			og_labels.add(label);
			if (tag_mapping && tag_mapping.get(label)) {
				label = tag_mapping.get(label);
			}

			if (label == last_label) {
				tagged_address.get(label).add(token);
			}
			else if (!tagged_address.has(label)) {
				tagged_address.set(label, [token]);
			}
			else {
				throw [address_string, this.parse(address_string), label];
			}

			last_label = label;
		}

		for (let token of tagged_address.keys()) {
			let component = tagged_address.get(token).join(' ');
			component = component.trim().replace(/[,;]+/gu, '');
			tagged_address.set(token, component);
		}

		if (og_labels.has('AddressNumber') && !is_intersection) {
			address_type = 'Street Address';
		}
		else if (!og_labels.has('AddressNumber') && is_intersection) {
			address_type = 'Intersection';
		}
		else if (og_labels.has('USPSBoxID')) {
			address_type = 'PO Box';
		}

		return [tagged_address, address_type];
	}

	tokenFeatures (token) {
		if (["\u0026", "\u0023", "\u00bd"].includes(token)) {
			var token_clean = token;
		}
		else {
			var token_clean = String(token).replace(/(^[\W]*)|([^.\w]*$)/gu, '');
		}
		var token_abbrev = String(token_clean).toLowerCase().replace(/[.]/, '')
		,	isdigit      = Math.max(1, parseInt(token_abbrev))
		;
		return new Map([
			['abbrev', token_clean.substr(-1) == "\u002e"]
		,	['digits', this.digits(token_clean)]
		,	['word', !isdigit ? token_abbrev : false]
		,	['trailing.zeros', isdigit ? this.trailingZeros(token_abbrev) : false]
		,	['length', isdigit ? "\u0064\u003A" + String(token_abbrev).length : "\u0077\u003A" + String(token_abbrev).length]
		,	['endsinpunc', Boolean(String(token).match(/.+[^.\w]/)) ? String(token).substr(-1) : false]
		,	['directional', DIRECTIONS.has(token_abbrev)]
		,	['street_name', STREET_NAMES.has(token_abbrev)]
		,	['has.vowels', Boolean(this.intersecting(Array.from(token_abbrev.substr(1)), Array.from('aeiou')).length)]
		]);
	}

	tokenize (address_string) {
		// if (!(address_string instanceof String)) {
		// 	let enc = new TextDecoder('utf8');
		// 	address_string = enc.decode(address_string);
		// }
		address_string = address_string.replace(/&#38;|&amp;/gu, '&');

		var re_tokens = /\(*\b[^\s,;#&()]+[.,;)\n]*|[#&]/gu;
		return new Set(address_string.match(re_tokens));
	}

	tokens2features (address) {
		address = Array.from(address);
		var feature_sequence  = [this.tokenFeatures(address[0])]
		,	previous_features = this.tokenFeatures(address[0])
		;

		Array.from(address).slice(1).forEach((token) => {
			let token_features   = this.tokenFeatures(token)
			,	current_features = this.tokenFeatures(token)
			;
			feature_sequence[feature_sequence.length - 1].set('next', current_features);
			token_features.set('previous', previous_features);

			feature_sequence.push(token_features);
			previous_features = current_features;
		});

		feature_sequence[0].set('address.start', true);
		feature_sequence[feature_sequence.length - 1].set('address.end', true);

		if (feature_sequence.length > 1) {
			feature_sequence[1].get('previous').set('address.start', true);
			feature_sequence[feature_sequence.length - 2].get('next').set('address.end', true);
		}

		return feature_sequence;
	}

	trailingZeros (token) {
		var results = String(token).match(/(0+)$/);
		if (results) {
			return results[0];
		}
		return '';
	}
}
