export const DefaultAdminPermissions = [
	{
		moduleName: 'Users',
		sortId: 1,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
		approval: true,
	},
	{
		moduleName: 'Roles',
		sortId: 2,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
		approval: true,
	},
	{
		moduleName: 'Dashboard',
		sortId: 3,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
		approval: true,
	}
];

export const DefaultPermissions = [
	{
		moduleName: 'Users',
		sortId: 1,
		all: false,
		view: false,
		edit: false,
		delete: false,
		add: false,
		approval: false,
	},
	{
		moduleName: 'Roles',
		sortId: 2,
		all: false,
		view: false,
		edit: false,
		delete: false,
		add: false,
		approval: false,
	},
	{
		moduleName: 'Dashboard',
		sortId: 3,
		all: false,
		view: false,
		edit: false,
		delete: false,
		add: false,
		approval: false,
	},
];

export const roles = [
	{
		name: 'Admin',
		description: 'All company permissions granted',
		isAdmin: true,
	},
	{
		name: 'Image Manager',
		description: 'All modules except organization settings',
		isAdmin: false,
	},
	{
		name: 'Salt Composition Manager',
		description: 'Employee Engagement only',
		isAdmin: false,
	},
];