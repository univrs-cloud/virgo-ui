import inflection from 'lodash-inflection';
import { assetIcon } from 'utils/asset_url';

_.templateSettings.imports = {
	...(_.templateSettings.imports ?? {}),
	assetIcon
};

_.mixin(inflection);
