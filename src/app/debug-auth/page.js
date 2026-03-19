import {
  resetAdminPassword,
  verifyPassword,
} from "@/lib/server-actions/debug";

export default async function ResetPasswordPage({ searchParams }) {
  const action = searchParams?.action;

  let result = null;

  if (action === "reset") {
    result = await resetAdminPassword();
  } else if (action === "verify") {
    result = await verifyPassword();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🔐 Admin Password Tools
        </h1>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href="/reset-password?action=verify"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🧪 Verify Current Password
            </a>
            <a
              href="/reset-password?action=reset"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Reset Password to "admin"
            </a>
          </div>

          {/* Results */}
          {result && (
            <div
              className={`rounded-lg p-6 ${
                result.success
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  result.success
                    ? "text-green-800 dark:text-green-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {result.success ? "✅ Success" : "❌ Error"}
              </h2>

              <p
                className={`mb-4 ${
                  result.success
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {result.message || result.error}
              </p>

              {result.passwordValid !== undefined && (
                <div className="bg-white dark:bg-gray-900 rounded p-4 mb-4">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">
                    Password Test Result:
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      result.passwordValid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {result.passwordValid ? "✅ VALID" : "❌ INVALID"}
                  </p>
                </div>
              )}

              {result.verification && (
                <div className="bg-white dark:bg-gray-900 rounded p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Verification:</strong> {result.verification}
                  </p>
                </div>
              )}

              {result.user && (
                <div className="bg-white dark:bg-gray-900 rounded p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Updated User:
                  </h3>
                  <pre className="text-sm text-gray-700 dark:text-gray-300">
                    {JSON.stringify(result.user, null, 2)}
                  </pre>
                </div>
              )}

              {result.hashInfo && (
                <div className="bg-white dark:bg-gray-900 rounded p-4 mt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Hash Information:
                  </h3>
                  <pre className="text-sm text-gray-700 dark:text-gray-300">
                    {JSON.stringify(result.hashInfo, null, 2)}
                  </pre>
                </div>
              )}

              {result.details && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                    Show technical details
                  </summary>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 mt-2 bg-white dark:bg-gray-900 p-4 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
              📝 Instructions:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-400">
              <li>
                First, click "Verify Current Password" to check if the hash is
                correct
              </li>
              <li>
                If verification fails, click "Reset Password" to generate a
                fresh hash
              </li>
              <li>
                After reset, try logging in with username:{" "}
                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">
                  admin
                </code>{" "}
                and password:{" "}
                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">
                  admin
                </code>
              </li>
              <li>
                <a
                  href="/loginadminusers"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Go to Login Page →
                </a>
              </li>
            </ol>
          </div>

          {/* Console Reminder */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-400 text-sm">
              💡 <strong>Tip:</strong> Check your terminal/console for detailed
              logs from the server actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
