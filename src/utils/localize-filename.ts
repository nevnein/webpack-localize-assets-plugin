import assert from 'assert';
import {
	Compilation,
	LocaleName,
	WP5,
} from '../types';
import {
	isWebpack5Compilation,
} from './webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name } = require('../../package.json');

const REGEXP_CONTENTHASH = /\[contenthash(?::(\d+))?\]/gi;


function findAll(subject: string, pattern: RegExp) {
	pattern.lastIndex = 0;

	const matches: RegExpExecArray[] = [];

	let match;
	while ((match = pattern.exec(subject)) !== null) {
		matches.push(match);
	}

	return matches;
}

export const interpolateLocaleToFileName = (
	compilation: WP5.Compilation,
	replaceWith: LocaleName,
) => {
	const { filename, chunkFilename } = compilation.outputOptions;

	// if (typeof filename === 'string') {
	// 	assert(filename.includes('[locale]'), 'output.filename must include [locale]');
	// }

	// if (typeof chunkFilename === 'string') {
	// 	assert(chunkFilename.includes('[locale]'), 'output.chunkFilename must include [locale]');
	// }

	const interpolateHook = (
		filePath: string | ((data: any) => string),
		data: any,
		info: any,
	) => {
		// Only for WP4. In WP5, the function is already called.
		// WP4: https://github.com/webpack/webpack/blob/758269e/lib/TemplatedPathPlugin.js#L84
		if (typeof filePath === 'function') {
			filePath = filePath(data);
		}

		filePath = filePath.replace(/\[locale\]/g, replaceWith);

		if (info && !info.wp5Contenthash) {
			const hasContenthash = findAll(filePath, REGEXP_CONTENTHASH);

			if (hasContenthash.length > 0) {
				info.wp5Contenthash = {
					filePath,
					data,
					matches: hasContenthash,
				};
			}
		}

		return filePath;
	};

	if (isWebpack5Compilation(compilation)) {
		compilation.hooks.assetPath.tap(
			name,
			interpolateHook,
		);
	} else {
		// @ts-expect-error Missing assetPath hook from @type
		compilation.mainTemplate.hooks.assetPath.tap(
			name,
			interpolateHook,
		);
	}
};
