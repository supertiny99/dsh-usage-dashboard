export function filterSessions(sessions, { day, project, model, search, sort }) {
	const query = search.trim().toLocaleLowerCase();
	const filtered = [];
	for (const session of sessions) {
		if (project && session.project !== project) continue;
		if (day && !session.activityDates.includes(day)) continue;
		if (
			query &&
			!`${session.title} ${session.cwd} ${session.id}`.toLocaleLowerCase().includes(query)
		)
			continue;
		const parts = session.breakdown.filter(
			(part) => (!day || part.date === day) && (!model || part.key === model)
		);
		if (model && !parts.length) continue;
		const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
		const models = new Map();
		for (const part of parts) {
			for (const key of Object.keys(tokens)) tokens[key] += part[key];
			const item = models.get(part.key) ?? {
				key: part.key,
				provider: part.provider,
				model: part.model,
				total: 0,
			};
			item.total += part.total;
			models.set(part.key, item);
		}
		filtered.push({ ...session, ...tokens, matchingModels: [...models.values()] });
	}
	filtered.sort((a, b) =>
		sort === 'recent' ? b.lastActivityAt - a.lastActivityAt : b.total - a.total
	);
	return filtered;
}
