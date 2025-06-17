export const DefaultAdminPermissions = [
	{
		moduleName: 'Users',
		sortId: 1,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
	},
	{
		moduleName: 'Roles',
		sortId: 2,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
	},
	{
		moduleName: 'Company Setup',
		sortId: 27,
		all: true,
		view: true,
		edit: true,
		delete: true,
		add: true,
	},
	
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
	},
	{
		moduleName: 'Roles',
		sortId: 2,
		all: false,
		view: false,
		edit: false,
		delete: false,
		add: false,
	},
	{
		moduleName: 'Company Setup',
		sortId: 27,
		all: false,
		view: false,
		edit: false,
		delete: false,
		add: false,
	},
];

export const roles = [
	{
		name: 'Admin',
		description: 'All company permissions granted',
		isAdmin: true,
	}
];

export const defaultCompanies = [
	{
		name: 'Test Company',
		address: '905',
		email: 'pratikp@serviots.com',
	}
];