// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

abstract contract PlatformRoles {
    uint8 public constant DEFAULT_ADMIN_ROLE = type(uint8).max;
    uint8 public constant CHIEF_ADMIN_ROLE = 224;
    uint8 public constant PLATFORM_ADMIN_ROLE = 192;
}