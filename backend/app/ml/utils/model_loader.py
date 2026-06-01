from __future__ import annotations

import pickle
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


ML_UNAVAILABLE_MESSAGE = "ML model is unavailable or input features are incomplete."


class ModelArtifactError(RuntimeError):
    """Raised when a model artifact cannot be loaded safely."""


@dataclass(frozen=True)
class ArtifactLoadResult:
    name: str
    available: bool
    artifact: Any | None = None
    error: str | None = None


ML_ROOT = Path(__file__).resolve().parents[1]
MODELS_ROOT = ML_ROOT / "models"
DATA_ROOT = ML_ROOT / "data"


def model_path(*parts: str) -> Path:
    return MODELS_ROOT.joinpath(*parts)


def data_path(*parts: str) -> Path:
    return DATA_ROOT.joinpath(*parts)


@lru_cache(maxsize=32)
def load_pickle_artifact(relative_path: str) -> Any:
    path = MODELS_ROOT / relative_path
    if not path.exists():
        raise ModelArtifactError(f"Missing ML artifact: {path.relative_to(ML_ROOT)}")

    try:
        try:
            import joblib  # type: ignore

            return joblib.load(path)
        except ImportError:
            with path.open("rb") as handle:
                return pickle.load(handle)
    except Exception as exc:  # noqa: BLE001 - surface safe ML fallback details.
        raise ModelArtifactError(f"{ML_UNAVAILABLE_MESSAGE} ({relative_path}: {exc})") from exc


def try_load_artifact(name: str, relative_path: str) -> ArtifactLoadResult:
    try:
        return ArtifactLoadResult(name=name, available=True, artifact=load_pickle_artifact(relative_path))
    except ModelArtifactError as exc:
        return ArtifactLoadResult(name=name, available=False, error=str(exc))


def load_many_artifacts(paths: dict[str, str]) -> dict[str, ArtifactLoadResult]:
    return {name: try_load_artifact(name, relative_path) for name, relative_path in paths.items()}
