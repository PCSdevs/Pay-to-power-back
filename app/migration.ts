import os from 'os';
import { setTimeout } from 'timers';
import { PrismaClient } from '@prisma/client';
import { DBChangeLog } from './resources/dbChangeLog';

const prisma = new PrismaClient();

interface UserInfo {
	readonly username: string;
	readonly uid: string;
	readonly gid: string;
	readonly env: string | undefined;
	readonly os: string;
}

const userInfo = (): UserInfo => {
	const userInfo = os.userInfo();
	return {
		username: userInfo.username,
		uid: String(userInfo.uid),
		gid: String(userInfo.gid),
		env: process.env.NODE_ENV,
		os: `${os.type()} [${os.platform()}]`,
	};
};

const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const acquireLock = async (): Promise<string> => {
	while (await prisma.migrationLock.findFirst({ where: { isLocked: true } })) {
		console.log('Migration lock is already acquired, waiting for 5000ms');
		await sleep(5000);
	}
	const entity = await prisma.migrationLock.create({
		data: {
			isLocked: true,
			lockedBy: userInfo().username,
			uid: String(userInfo().uid),
			gid: String(userInfo().gid),
			env: `${userInfo().env}`,
			os: userInfo().os,
		},
	});
	console.log('Migration lock acquired');
	await prisma.migrationLock.deleteMany({ where: { isLocked: false } });
	return entity.id;
};

const releaseLock = async (lockId: string): Promise<void> => {
	await prisma.migrationLock.delete({ where: { id: lockId } });
	console.log('Migration lock released');
};

export const migrate = async (): Promise<void> => {
	const lockId = await acquireLock();
	const modules: any[] = [];
	try {
		const N = DBChangeLog.length;
		for (let index = 0; index < N; index++) {
			const change = DBChangeLog[index];
			if (await prisma.migration.findFirst({ where: { name: change } })) {
				continue;
			}
			const module = await import(`./resources/migrations/${change}`);
			await module.up();
			modules.push(module);
			await prisma.migration.create({
				data: {
					name: change,
					username: userInfo().username,
					uid: userInfo().uid,
					gid: userInfo().gid,
					env: `${userInfo().env}`,
					os: userInfo().os,
				},
			});
		}
	} catch (error) {
		console.error('Error in migration', error);
		modules.reverse();
		for (const module of modules) {
			await module.down();
		}
		process.exit(1);
	} finally {
		await releaseLock(lockId);
	}
};
