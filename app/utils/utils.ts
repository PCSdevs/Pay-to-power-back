import { prisma } from "../client/prisma";

export function invalidText(value: any) {
  return (
    value == null ||
    value == undefined ||
    value.toString().trim().length == 0 ||
    value === "null"
  );
}

export const disablePermissions = (permissions: any) => {
	const _permissions = permissions.map((permission: any) => {
		if (permission.moduleName === 'Roles') {
			return {
				...permission,
				isAddDisabled: true,
				isDeleteDisabled: true,
			};
		} else {
			return permission;
		}
	});
	return _permissions;
};

export const generateUnique3CharId = async (): Promise<string> => {
	const maxAttempts = 10;
  
	for (let i = 0; i < maxAttempts; i++) {
	  const id = Math.random().toString(36).substring(2, 5).toUpperCase();
	  const exists = await prisma.device.findUnique({ where: { generatedDeviceId: id } });
  
	  if (!exists) return id;
	}
  
	throw new Error('Failed to generate unique 3-character ID after multiple attempts');
  };
  
  export const generate7CharKey = () => Math.random().toString(36).substring(2, 9).toUpperCase();


  