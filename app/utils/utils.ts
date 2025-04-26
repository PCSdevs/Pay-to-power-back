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
