from typing import Annotated

from fastapi import APIRouter, Depends

from app.accounts.dependencies import AccountContext, require_account
from app.accounts.schemas import (
    AccountLoginRequest,
    AccountRecoverRequest,
    AccountRecoveryCodesResponse,
    AccountSignupRequest,
)
from app.accounts.service import (
    login_account,
    recover_account,
    regenerate_recovery_codes,
    signup_account,
)
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1/accounts", tags=["accounts"])


@router.post("")
async def signup_route(payload: AccountSignupRequest) -> dict:
    result = signup_account(payload)
    return success_envelope(result.model_dump(mode="json"))


@router.post("/login")
async def login_route(payload: AccountLoginRequest) -> dict:
    result = login_account(payload)
    return success_envelope(result.model_dump(mode="json"))


@router.post("/recover")
async def recover_route(payload: AccountRecoverRequest) -> dict:
    result = recover_account(payload)
    return success_envelope(result.model_dump(mode="json"))


@router.post("/recovery-codes/regenerate")
async def regenerate_recovery_codes_route(
    account: Annotated[AccountContext, Depends(require_account)],
) -> dict:
    codes = regenerate_recovery_codes(account.account_id)
    response = AccountRecoveryCodesResponse(recovery_codes=codes)
    return success_envelope(response.model_dump(mode="json"))
