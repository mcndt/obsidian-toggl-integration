/**
 * @param check version string to check. e.g. "0.13.21"
 * @param major Minimum major version
 * @param minor Minimum minor version
 * @param patch Minimum patch version
 * @return true if input string satisfies the major, minor and patch values (larger or equal than)
 */
export function checkVersion(
	check: string,
	major: number,
	minor: number,
	patch: number
): boolean {
	const [checkMajor, checkMinor, checkPatch] = check.split('.');
	if (
		parseInt(checkMajor) >= major &&
		parseInt(checkMinor) >= minor &&
		parseInt(checkPatch) >= patch
	) {
		return true;
	}
	return false;
}
