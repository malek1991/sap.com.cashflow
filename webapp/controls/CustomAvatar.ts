import Log from "sap/base/Log";
import Avatar from "sap/m/Avatar";
import AvatarType from "sap/m/AvatarType";

export default class CustomAvatar extends Avatar {
	/**
	 * Checks the validity of the <code>initials</code> parameter and returns <code>true</code> if the
	 * initials are correct.
	 *
	 * @param {string} sInitials The initials value
	 * @returns {boolean} The initials are valid or not
	 * @private
	 */

	_areInitialsValid(sInitials: string): boolean {
		var validInitials = /^[a-zA-Z\xc0-\xd6\xd8-\xdc\xe0-\xf6\xf8-\xfc]{1,4}$/;
		if (!validInitials.test(sInitials)) {
			Log.warning(
				"Initials should consist of only 1,2 or 3 latin letters",
				// @ts-ignore
				this
			);
			// @ts-ignore
			this._sActualType = AvatarType.Icon;
			// @ts-ignore
			this._bIsDefaultIcon = true;
			return false;
		}

		return true;
	}
}
