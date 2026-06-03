
export default function Unauthorized() {

  return (

    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-8">

      <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-10 text-center max-w-lg">

        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">

          <div className="text-5xl text-red-400">
            ⚠
          </div>

        </div>

        <h1 className="text-4xl font-black text-white mb-4">
          Access Denied
        </h1>

        <p className="text-gray-400 text-lg">
          You do not have permission to access this operational zone.
        </p>

      </div>

    </div>

  );

}