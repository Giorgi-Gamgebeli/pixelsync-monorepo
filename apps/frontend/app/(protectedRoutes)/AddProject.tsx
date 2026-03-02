"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import Modal from "../_components/Modal";

function AddProject() {
  return (
    <div>
      <Modal>
        <Modal.Open opens="addProject">
          <button className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-surface text-gray-500 transition-all hover:rounded-xl hover:bg-surface/80 hover:text-white">
            <Icon icon="mdi:plus" className="text-2xl" />
          </button>
        </Modal.Open>
        <Modal.Window name="addProject">
          <div className="flex w-96 flex-col gap-4 p-2">
            <h2 className="text-lg font-semibold text-white">
              Create a Project
            </h2>
            <p className="text-sm text-gray-500">
              Projects are shared workspaces where your team collaborates on
              rooms.
            </p>

            <div>
              <label
                htmlFor="projectName"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Project name
              </label>
              <input
                id="projectName"
                type="text"
                placeholder="e.g., Marketing Website"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="bg-brand-500 hover:bg-brand-600 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors">
                Create Project
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-gray-300">
                Already have an invite?
              </p>
              <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface">
                <Icon icon="mdi:link-variant" className="text-lg" />
                Join with Invite Link
              </button>
            </div>
          </div>
        </Modal.Window>
      </Modal>
    </div>
  );
}

export default AddProject;
