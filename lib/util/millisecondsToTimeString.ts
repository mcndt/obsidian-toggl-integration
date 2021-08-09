import moment from 'moment';

export default function millisecondsToTimeString(ms: number): string {
	const dur = moment.duration(ms);
	const [hr, min, sec] = [dur.hours(), dur.minutes(), dur.seconds()];
	return `${hr}:${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
}
