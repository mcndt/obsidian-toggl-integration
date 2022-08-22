export default function millisecondsToTimeString(ms: number): string {
	const sec = Math.round((ms / 1000) % 60);
	const min = Math.floor((ms / 1000 / 60) % 60);
	const hr = Math.floor(ms / 1000 / 60 / 60);

	return `${hr}:${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
}
