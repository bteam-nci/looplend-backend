const fs = require('fs');
const path = require('path');

function flattenDependencyTree(packageName) {
	const nodeModulesDir = path.resolve(__dirname, 'node_modules');
	const packageDir = path.join(nodeModulesDir, packageName);

	if (!fs.existsSync(packageDir)) {
		console.error(`Package "${packageName}" not found in the dependencies.`);
		return;
	}

	const dependencyTree = {};

	function traverseDependencyTree(packageDir, parent) {
		const packageJsonPath = path.join(packageDir, 'package.json');
		const packageJson = require(packageJsonPath);

		if (packageJson.dependencies) {
			for (const [dependency, version] of Object.entries(packageJson.dependencies)) {
				if (!dependency.startsWith('@types')) {
					const fullDependencyName = parent ? `${parent}/${dependency}` : dependency;
					dependencyTree[fullDependencyName] = version;
					const subPackageDir = path.join(nodeModulesDir, dependency);
					traverseDependencyTree(subPackageDir, fullDependencyName);
				}
			}
		}
	}

	traverseDependencyTree(packageDir, null);
	return dependencyTree;
}
function formatDependencyPaths(dependencyTree) {
	const formattedPaths = {};

	for (const [dependency, version] of Object.entries(dependencyTree)) {
		const parts = dependency.split('/');
		const child = parts.pop();
		const parent = parts.join('/');

		if (!parent || !formattedPaths[parent]) {
			formattedPaths[dependency] = `\t\t\t- node-modules/${dependency}/**/*`;
		}
	}

	return formattedPaths;
}
const dependencyTree = flattenDependencyTree("@clerk/clerk-sdk-node");
const formattedPaths = formatDependencyPaths(dependencyTree);

for (const dependencyPath of Object.values(formattedPaths)) {
	console.log(dependencyPath);
}

