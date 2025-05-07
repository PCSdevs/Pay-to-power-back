import { roleRepository } from "../repositories/roleRepository";
import { userCompanyRoleRepository } from "../repositories/userCompanyRoleRepository";

export const createAndAssignRole=async (
  roleData: RoleData,
  companyId: string,
  userId: string,
  isDefault: boolean
)=>{
  const role = await roleRepository.createRole(
      roleData.name,
      roleData.description,
      roleData.isAdmin,
      companyId,
      userId,
      isDefault
  );
  await userCompanyRoleRepository.addUserByCompanyIdAndRoleId(companyId, role.id);
}
type RoleData = {
  name: string;
  description: string;
  isAdmin: boolean;
};