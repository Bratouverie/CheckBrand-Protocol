// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RolesControl
 * @dev This contract implements a hierarchical role-based access control system, 
 * allowing for the creation, assignment, and revocation of roles with different levels of access. 
 * It is designed to be extendable by child contracts and provides an easy-to-use interface 
 * for managing permissions. Features include the creation of custom roles, granting and revoking roles, 
 * changing roles, and checking access permissions.
 * 
 * Roles can be created using the uint8 role level:
 * 
 * ```solidity 
 * uint8 public constant MY_ROLE = 1;
 * ```
 * 
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasAccess}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasAccess(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 * 
 * Roles can be granted and revoked dynamically via the {grantRole} and {revokeRole} functions. 
 * Roles have a hierarchy of levels and only higher level roles can manage lower level roles. 
 * To get access via {hasAccess} or {accessOnly}, the sender must have a role of the same level or higher.
 * 
 * By default, the `DEFAULT_ADMIN_ROLE` role is created and has a maximum level, 
 * which means that accounts with this role will be able to grant or revoke any other roles.
 * 
 * `DEFAULT_ADMIN_ROLE` has the highest level 255 (type(uint8).max)
 * Members with no role default to level 0
 */

library RolesControl {

    // RoleStorage struct containing role members and their mapping
    struct RoleStorage {
        address[] members;
        mapping(address => uint256) memberId;
    }

    struct Asset {
        // Mappings for storing roles and role storages
        mapping(address => uint8) _role;
        mapping(uint8 => RoleStorage) _rolesStorage;
    }

    event RoleGranted(uint8 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(uint8 indexed role, address indexed account, address indexed sender);

    // Modifier for checking access based on role
    modifier accessOnly(Asset storage asset, uint8 role) {
        _checkRole(asset, role);
        _;
    }

    /**
     * @dev Returns the list of members for a given role.
     * @param role - The role to list members for.
     * @return address[] - The array of member addresses.
     */
    function listAssetRoleMembers(Asset storage asset, uint8 role) internal view returns (address[] memory) {
        return asset._rolesStorage[role].members;
    }

    /**
     * @dev Returns the role of a given account.
     * @param account - The address of the account.
     * @return role - The role of the account.
     */
    function getRole(Asset storage asset, address account) internal view returns (uint8 role) {
        return asset._role[account];
    }

    /**
     * @dev Checks if an account has access to a given role.
     * @param role - The role to check access for.
     * @param account - The address of the account.
     * @return bool - True if the account has access, false otherwise.
     */
    function hasAccess(Asset storage asset, uint8 role, address account) internal view returns (bool) {
        return asset._role[account] >= role;
    }

    /**
     * @dev Checks if an account has a role.
     * @param account - The address of the account.
     * @return bool - True if the account has a role, false otherwise.
     */
    function hasAnyRole(Asset storage asset, address account) internal view returns (bool) {
        return asset._role[account] > 0;
    }

    /**
     * @dev Checks if an account has a specific role.
     * @param role - The role to check.
     * @param account - The address of the account.
     * @return bool - True if the account has the role, false otherwise.
     */
    function hasRole(Asset storage asset, uint8 role, address account) internal view returns (bool) {
        return hasAnyRole(asset, account) && asset._role[account] == role;
    }

    /**
     * @dev Checks if the caller has the given role.
     * @param role - The role to check.
     */
    function _checkRole(Asset storage asset, uint8 role) internal view {
        _checkRole(asset, role, msg.sender);
    }

    /**
     * @dev Checks if an account has the given role.
     * @dev Revert with a standard message if `account` is missing role with level `number`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     * /^AccessControl: account (0x[0-9a-f]{40}) is missing role with level (0x[0-255]{1})$/
     * 
     * @param role - The role to check.
     * @param account - The address of the account.
     */
    function _checkRole(Asset storage asset, uint8 role, address account) internal view {
        if (!hasAccess(asset, role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(account),
                        " is missing role with level ",
                        Strings.toString(uint256(role))
                    )
                )
            );
        }
    }

    /**
     * @dev Returns the role admin for a given role.
     * @param role - The role to get the admin for.
     * @return roleAdmin - The role admin.
     */
    function getRoleAdmin(uint8 role) internal pure returns (uint8) {
        uint8 max = type(uint8).max;
        return role < max ? role + 1 : max;
    }

    /**
     * @dev Grants a role to an account.
     * @param role - The role to grant.
     * @param account - The address of the account.
     */
    function grantRole(Asset storage asset, uint8 role, address account) internal accessOnly(asset, getRoleAdmin(role)) {
        _grantRole(asset, role, account);
    }

    /**
     * @dev Revokes a role from an account.
     * @param role - The role to revoke.
     * @param account - The address of the account.
     */
    function revokeRole(Asset storage asset, uint8 role, address account) internal accessOnly(asset, getRoleAdmin(role)) {
        _revokeRole(asset, role, account);
    }

    /**
     * @dev Revokes any role from an account.
     * @param account - The address of the account.
     */
    function revokeAccount(Asset storage asset, address account) internal accessOnly(asset, getRoleAdmin(asset._role[account])) {
        _revokeAccount(asset, account);
    }

    /**
     * @dev Sets up a role for an account.
     * @param role - The role to set up.
     * @param account - The address of the account.
     */
    function _setupRole(Asset storage asset, uint8 role, address account) internal {
        _grantRole(asset, role, account);
    }

    /**
     * @dev Internal function for granting a role to an account.
     * @param role - The role to grant.
     * @param account - The address of the account.
     */
    function _grantRole(Asset storage asset, uint8 role, address account) internal {
        require(!hasAnyRole(asset, account), "AccessControl: Already has role");
        asset._role[account] = role;

        RoleStorage storage rolesStorage = asset._rolesStorage[role];
        rolesStorage.memberId[account] = rolesStorage.members.length;
        rolesStorage.members.push(account);

        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Internal function for revoking a role from an account.
     * @param role - The role to revoke.
     * @param account - The address of the account.
     */
    function _revokeRole(Asset storage asset, uint8 role, address account) internal {
        require(hasRole(asset, role, account), "AccessControl: Already has no role");
        delete asset._role[account];

        RoleStorage storage rolesStorage = asset._rolesStorage[role];
        uint256 id = rolesStorage.memberId[account];

        rolesStorage.members[id] = rolesStorage.members[rolesStorage.members.length - 1];
        rolesStorage.memberId[rolesStorage.members[id]] = id;
        rolesStorage.members.pop();

        emit RoleRevoked(role, account, msg.sender);
    }

    /**
     * @dev Internal function for revoking all roles from an account.
     * @param account - The address of the account.
     */
    function _revokeAccount(Asset storage asset, address account) internal {
        require(hasAnyRole(asset, account), "AccessControl: Already has no any role");
        _revokeRole(asset, asset._role[account], account);
    }
}