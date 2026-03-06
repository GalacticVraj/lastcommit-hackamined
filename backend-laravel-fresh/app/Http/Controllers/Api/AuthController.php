<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)
            ->where('isActive', true)
            ->whereNull('deletedAt')
            ->with(['roles.role.permissions.permission'])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        // Flatten permissions
        $permissions = [];
        $roleNames = [];
        foreach ($user->roles as $ur) {
            $roleNames[] = $ur->role->name;
            foreach ($ur->role->permissions as $rp) {
                $perm = $rp->permission->module . '.' . $rp->permission->action;
                if (!in_array($perm, $permissions)) {
                    $permissions[] = $perm;
                }
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $roleNames,
                'permissions' => $permissions,
            ],
        ], 'Login successful');
    }

    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        if ($request->has('roleIds')) {
            foreach ($request->roleIds as $roleId) {
                $user->roles()->create(['role_id' => $roleId]);
            }
        }

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ], 'User created successfully', 201);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => $user->permissions ?? ['*'],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request)
    {
        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * GET /api/v1/auth/permissions
     */
    public function getPermissions()
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();
        return $this->successResponse($permissions);
    }
}
