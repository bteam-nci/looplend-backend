const fs = require('fs');
const path = require('path');

function getPackageDependencies(packageName, packageDir) {
	const packagePath = path.join(packageDir, 'node_modules', packageName);

	if (!fs.existsSync(packagePath)) {
		throw new Error(`Package '${packageName}' not found.`);
	}

	const packageJsonPath = path.join(packagePath, 'package.json');

	if (!fs.existsSync(packageJsonPath)) {
		throw new Error(`'package.json' not found for '${packageName}'.`);
	}

	const packageJson = require(packageJsonPath);
	const dependencies = Object.keys(packageJson.dependencies || {});

	const subDependencies = dependencies.flatMap((dependency) => {
		try {
			return getPackageDependencies(dependency, packageDir);
		} catch (error) {
			console.error(`Failed to retrieve dependencies for '${dependency}'.`);
			return [];
		}
	});
	// remove duplicate dependencies
	return [...dependencies, ...subDependencies]
		.filter((d, i, arr) => !d.startsWith("@types") )
	// return [...dependencies, ...subDependencies].filter(d=>!d.startsWith('@types'));
}

// Example usage
const packageName = "@clerk/clerk-sdk-node";
const packageDir = __dirname;
const dependencies = getPackageDependencies(packageName, packageDir);
console.log(dependencies.map(d=>`\t\t\t\t- node_modules/${d}/**/*`).join('\n'));
